require('./rt/electron-rt');
//////////////////////////////
// User Defined Preload scripts below
import { contextBridge, ipcRenderer } from 'electron';

// Ponte para salvar os PDFs dos relatórios.
//
// Aqui não se usa o "Salvar como" do sistema de propósito. No Linux o diálogo
// nativo de arquivo do Electron não fica preso à janela do app: assim que o
// usuário clica no app, o diálogo vai para trás e não há como trazê-lo de
// volta — e como ele é modal, o programa fica travado esperando uma resposta
// impossível de dar (em tela cheia, prende até a barra de tarefas).
//
// Por isso quem pergunta o nome e a pasta é uma tela do próprio SRME, e aqui só
// chega a decisão já tomada.
contextBridge.exposeInMainWorld('srmeDesktop', {
  salvarPdf: (pasta: string, nomeArquivo: string, base64: string): Promise<string> =>
    ipcRenderer.invoke('srme:salvar-pdf', pasta, nomeArquivo, base64),
});
