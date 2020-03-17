import path from 'path'
import { existsSync } from 'fs'
import url from 'url'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import settings from 'electron-settings'
import * as R from 'ramda'


/**
 * Facade for application windows/project state.
 * Encapsulates settings access.
 */

const MAX_RECENT_PROJECTS = 5

const APP_KEY = 'app'
const STATE_KEY = `${APP_KEY}.state`
const WINDOWS_KEY = `${STATE_KEY}.windows`
const windowKey = id => `${WINDOWS_KEY}.${id}`
const RECENT_PROJECTS_KEY = `${STATE_KEY}.recent-projects`

/**
 * Merge current value (object) with supplied (map) function.
 */
const merge = keyPath => (fn, defaultvalue) =>
  settings.set(keyPath, fn(settings.get(keyPath, defaultvalue)))

// TODO: unit test

let shuttingDown = false

const sendMessage = window => (event, ...args) => {
  if (!window) return
  window.send(event, args)
}

const windowTitle = options => options.path ? path.basename(options.path) : 'ODIN - C2IS'


/**
 * Open project window.
 *
 * @param {*} options window options
 */
const createProject = async (options = {}) => {

  // Request project path from user, if not given.
  if (!options.path) {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (canceled) return
    options.path = filePaths && filePaths && filePaths[0]
  }

  // Still no path? Bail out.
  if (!options.path) return

  const devServer = process.argv.indexOf('--noDevServer') === -1
  const hotDeployment = process.defaultApp ||
    /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
    /[\\/]electron[\\/]/.test(process.execPath)

  const windowUrl = (hotDeployment && devServer)
    ? url.format({ protocol: 'http:', host: 'localhost:8080', pathname: 'index.html', slashes: true })
    : url.format({ protocol: 'file:', pathname: path.join(app.getAppPath(), 'dist', 'index.html'), slashes: true })

  const window = new BrowserWindow({
    ...options,
    title: windowTitle(options),
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  const key = windowKey(window.id)
  merge(key)(props => ({ ...props, ...options }), {})

  const updateBounds = () => merge(key)(props => ({ ...props, ...window.getBounds() }))
  const deleteWindow = () => {
    // don't delete when shutting down the application.
    if (shuttingDown) return
    settings.delete(windowKey(window.id))
  }

  window.viewport = options.viewport
  window.path = options.path
  window.once('ready-to-show', () => window.show())
  window.once('close', deleteWindow)
  window.on('page-title-updated', event => event.preventDefault())
  window.on('move', updateBounds)
  window.on('resize', updateBounds)
  // TODO: support fullscreen

  window.loadURL(windowUrl)
  return window
}


/**
 * Open project path in current or new window.
 *
 * @param {*} window project window (optional)
 * @param {*} projectPath the path to a project (Optional. If given, the application will not open the chooseProjectPath dialog.)
 */
const openProject = (window, projectPath) => {

  const open = ({ canceled, filePaths = [] }) => {
    if (canceled) return
    if (!filePaths.length) return

    const path = filePaths[0]

    if (!existsSync(path)) {
      return dialog.showErrorBox('Path does not exist', `The project path ${path} does not exist.`)
    }

    // Check if project is already open in another window:
    const candidate = Object
      .entries(settings.get(WINDOWS_KEY, {}))
      .find(([_, value]) => value.path === path)

    if (candidate) return BrowserWindow.fromId(Number.parseInt(candidate[0])).focus()

    if (!window) createProject({ path })
    else {
      merge(windowKey(window.id))(props => ({ ...props, path }), {})
      window.setTitle(windowTitle({ path }))
      sendMessage(window)('IPC_OPEN_PROJECT', path)
    }

    // Remember path in 'recent projects':
    // Add path to tail, make entries unique and cap to max size:
    const prepend = R.compose(R.slice(0, MAX_RECENT_PROJECTS), R.uniq, R.prepend(path))
    merge(RECENT_PROJECTS_KEY)(prepend, [])
  }

  if (projectPath) {
    open({ filePaths: [projectPath] })
  } else {
    dialog.showOpenDialog(window, { properties: ['openDirectory'] })
      .then(open)
      .catch(/* TODO: handle */)
  }
}


// listeners =>

app.on('before-quit', () => (shuttingDown = true))
app.on('ready', () => {

  // Since window ids are not stable between sessions,
  // we clear state now and recreate it with current ids.
  const state = Object.values(settings.get(WINDOWS_KEY, {}))
  settings.delete(WINDOWS_KEY)

  if (state.length) state.forEach(createProject)
  else createProject(/* empty project */)
})

ipcMain.on('IPC_VIEWPORT_CHANGED', (event, viewport) => {
  const { id } = event.sender.getOwnerBrowserWindow()
  merge(windowKey(id))(props => ({ ...props, viewport }), {})
})

export default {
  createProject,
  openProject,
  clearRecentProjects: () => settings.set(RECENT_PROJECTS_KEY, []),
  recentProjects: () => settings.get(RECENT_PROJECTS_KEY, []),
  watchRecentProjects: handler => settings.watch(RECENT_PROJECTS_KEY, handler)
}