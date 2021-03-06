import isElectronFunction from 'is-electron';

export const isElectron = () => isElectronFunction();

export const ipcRendererFunc = () => {
  const { ipcRenderer } = window.require('electron');
  return ipcRenderer;
};

export const getElectronProperty = (name) => {
  const electron = window.require('electron');
  if (!electron[name]) {
    return null;
  }
  return electron[name];
};

export const restartNode = (args?: any) => {
  if (isElectron()) {
    const ipcRenderer = ipcRendererFunc();
    ipcRenderer.send('restart-app', args);
  } else {
    throw new Error('Unable to restart');
  }
};

export const restartNodeWithReIndexing = (args?: any) => {
  if (isElectron()) {
    const ipcRenderer = ipcRendererFunc();
    ipcRenderer.send('start-defi-chain', args);
  } else {
    throw new Error('Unable to restart');
  }
};

export const closeApp = (args?: any) => {
  if (isElectron()) {
    const ipcRenderer = ipcRendererFunc();
    ipcRenderer.send('close-app', args);
  } else {
    throw new Error('Unable to close app');
  }
};
