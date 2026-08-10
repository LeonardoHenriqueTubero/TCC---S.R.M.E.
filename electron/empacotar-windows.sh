#!/usr/bin/env bash
#
# Empacota a versão de Windows a partir do Linux.
#
#   ./empacotar-windows.sh          # 64 bits (padrão)
#   ./empacotar-windows.sh ia32     # 32 bits
#
# Por que não é só `electron-builder --win`: o electron-builder recompila os
# módulos nativos sempre para a plataforma do host. O SQLite é um módulo nativo,
# então o instalador de Windows saía com o binário .node do LINUX dentro — e o
# app abria no Windows sem banco nenhum, porque a biblioteca não carrega.
#
# A saída é baixar o binário de Windows pronto (o projeto do better-sqlite3
# publica um para cada arquitetura e cada ABI do Electron), pô-lo no lugar e
# empacotar com o npmRebuild desligado, para o electron-builder não desfazer a
# troca. E é por isso que 32 e 64 bits precisam de uma passada cada: só cabe um
# binário por vez em node_modules.
#
# ATENÇÃO à versão do Electron: os binários de Windows existem até a ABI 146,
# que é a do Electron 42. Subir para o 43 (ABI 148) quebra este script — foi
# exatamente o que aconteceu e o motivo de o projeto estar no 42.
#
# PRECISA DE WINE INSTALADO NO SISTEMA (`sudo apt install wine`).
#
# Para gerar o desinstalador, o NSIS precisa EXECUTAR um .exe que ele mesmo
# acabou de compilar, e fora do Windows isso quer dizer Wine. Sem ele o
# empacotamento morre em "wine process failed ENOENT" com o instalador quase
# pronto, deixando um .exe truncado de uns 190 KB em dist/ — que parece um
# instalador e não é. Se isso acontecer, apague o arquivo.
#
# O electron-builder tem uma opção de baixar o próprio Wine
# (`-c.toolsets.wine=1.0.1`), mas ela NÃO funciona: o pacote publicado traz só o
# lado unix (lib/wine/x86_64-unix/*.so) e nenhum módulo PE — não há um único .dll
# dentro dele —, então o Wine sobe e morre em "failed to load ntdll.dll error
# c0000135". O próprio esquema de configuração marca essa versão como Beta.
# Testado e descartado; não adianta tentar de novo sem antes conferir se o
# electron-builder corrigiu o pacote.
#
# Sobre o `win.signExecutable=false`: o electron-builder assina os .exe com o
# signtool.exe da Microsoft, outra coisa que no Linux só roda dentro do Wine.
# Como o projeto não tem certificado de assinatura, ela não aconteceria de
# qualquer jeito: desligá-la não tira nada do instalador, só evita a etapa inútil.
# O que NÃO se pode usar aqui é o `signAndEditExecutable=false`, que junto com a
# assinatura desliga também a gravação do ícone e da versão dentro do .exe — o
# app sairia com o ícone genérico do Electron. (Sem certificado, o Windows mostra
# o aviso do SmartScreen na primeira execução de um jeito ou de outro.)
#
# NENHUMA PASTA DO CAMINHO DO PROJETO PODE TERMINAR EM PONTO.
#
# O Windows remove pontos finais de cada parte de um caminho, e o Wine obedece à
# mesma regra. Esta pasta já se chamou "TCC---S.R.M.E." e o Wine a traduzia para
# "TCC---S.R.M.E", onde não achava mais nada: o empacotamento morria em
# `failed to open ... c0000135` bem no fim, ao rodar o instalador para extrair
# dele o desinstalador. Não é defeito do Wine, e nenhuma versão dele resolve;
# link simbólico de nome limpo também não, porque o electron-builder resolve o
# caminho real do projeto antes de chamar o Wine. A pasta foi renomeada para
# "TCC---S.R.M.E" (sem o ponto) e é assim que precisa continuar.
#
# O binário do Linux é devolvido no fim, senão o `npm run electron:start` desta
# máquina passaria a carregar uma DLL de Windows.

set -euo pipefail

cd "$(dirname "$0")"

ARQUITETURA="${1:-x64}"
if [ "$ARQUITETURA" != "x64" ] && [ "$ARQUITETURA" != "ia32" ]; then
  echo "ERRO: arquitetura '$ARQUITETURA' — use x64 ou ia32." >&2
  exit 1
fi

SQLITE_DIR="node_modules/better-sqlite3-multiple-ciphers"
BINARIO="$SQLITE_DIR/build/Release/better_sqlite3.node"
GUARDADO="$(mktemp -d)/better_sqlite3.linux.node"
ELECTRON="$(node -p "require('electron/package.json').version")"

echo "==> Windows $ARQUITETURA, Electron $ELECTRON; guardando o binário do Linux"
cp "$BINARIO" "$GUARDADO"
# Devolve o binário do Linux aconteça o que acontecer, inclusive se o
# empacotamento falhar no meio.
trap 'cp "$GUARDADO" "$BINARIO"; echo "==> binário do Linux devolvido"' EXIT

echo "==> baixando o binário de Windows ($ARQUITETURA) do SQLite"
(cd "$SQLITE_DIR" && npx --yes prebuild-install \
  --runtime=electron --target="$ELECTRON" --arch="$ARQUITETURA" --platform=win32)

# Confere que veio mesmo o que se pediu: um .node de 64 bits dentro do
# instalador de 32 não daria erro nenhum aqui, só na máquina do usuário.
DESCRICAO="$(file -b "$BINARIO")"
case "$ARQUITETURA" in
  x64)  ESPERADO="PE32+" ;;
  ia32) ESPERADO="PE32 " ;;
esac
if ! echo "$DESCRICAO" | grep -q "MS Windows" || ! echo "$DESCRICAO" | grep -q "^$ESPERADO"; then
  echo "ERRO: o binário baixado não bate com $ARQUITETURA — $DESCRICAO" >&2
  exit 1
fi
echo "    ok: $DESCRICAO"

echo "==> empacotando"
npm run build
npx electron-builder build --win --"$ARQUITETURA" \
  -c ./electron-builder.config.json -c.npmRebuild=false \
  -c.win.signExecutable=false -p never
