import projects from '../projects'

const buildRecentProjectsSubmenu = () => {

  const entries = projects.recentProjects().map(project => ({
    label: project,
    click: (menuItem, browserWindow, event) => projects.openProject(browserWindow, project)
  }))

  if (entries && entries.length > 0) {
    entries.push({ type: 'separator' })
    entries.push({
      label: 'Clear Recently Opened',
      click: projects.clearRecentProjects
    })
  }

  return entries
}

const menu = () => {
  const menu = {
    label: 'File',
    submenu: [
      {
        label: 'New Project',
        accelerator: 'Shift+CmdOrCtrl+N',
        click: () => projects.createProject()
      },
      {
        label: 'Open Project...',
        accelerator: 'CmdOrCtrl+O',
        click: (menuItem, browserWindow, event) => projects.openProject(browserWindow)
      },
      {
        label: 'Open Recent Projects...',
        submenu: buildRecentProjectsSubmenu()
      },
      {
        label: 'Save As...',
        accelerator: 'Shift+CmdOrCtrl+S',
        click: () => projects.saveProject()
      }
    ]
  }

  if (process.platform !== 'darwin') {
    menu.submenu.push({ type: 'separator' })
    menu.submenu.push({ role: 'quit' })
  }

  return menu
}


export default menu