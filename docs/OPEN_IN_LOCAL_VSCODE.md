# Abrir no VS Code local

Este documento mostra formas rápidas de abrir este workspace no VS Code instalado na sua máquina (desktop).

Opções disponíveis:


Este documento mostra formas rápidas de abrir este workspace no VS Code instalado na sua máquina (desktop).

Opções disponíveis:

- Botão HTML (recomendado): abra `docs/open-in-local-vscode.html` no seu navegador e clique em "Abrir no VS Code" — isso utiliza o esquema `vscode://file/` para pedir ao VS Code que abra o arquivo de workspace.
- Linha de comando (fallback): execute o comando abaixo no seu terminal local:

```bash
code -r /home/rootkit/Apps/xRatEcosystem/xRatEcosystem.code-workspace
```

Notas:

- O link `vscode://file` só funciona se o VS Code desktop estiver instalado e registrado como manipulador do esquema na sua máquina.
- Ajuste o caminho do arquivo de workspace se você clonou o repositório em outro local.
- No Linux, se o `code` não estiver no PATH, use o caminho para o executável do VS Code (por exemplo `/usr/bin/code`).

Se quiser, posso também adicionar um link direto no `README.md` que aponta para o HTML ou para o esquema `vscode://file`.
