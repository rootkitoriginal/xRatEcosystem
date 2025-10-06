# Dev Container (modo de desenvolvimento)

Este projeto inclui um serviço de desenvolvimento no `docker-compose.yml` chamado `devcontainer` (nome do container: `xrat-devcontainer`). A ideia é fornecer um container leve que monte o workspace, exponha portas comuns de desenvolvimento e permita o uso do recurso Remote - Containers / DevContainers do VS Code.

O serviço foi projetado para permanecer em execução (`sleep infinity`) e pode ser usado com o VS Code para anexar a sessão de desenvolvimento.

- 3000: backend
- 5173: frontend
- 9229: node inspector (opcional)
Como usar

1. Suba o container (em background):

```bash
docker compose up -d devcontainer
```

2. Abra o VS Code (desktop) e use a extensão **Remote - Containers** → "Attach to Running Container..." → selecione `xrat-devcontainer`. Alternativamente, use o comando de paleta `Remote-Containers: Attach to Running Container...`.

3. O container monta o workspace em `/workspace` (mesmo caminho dentro do container). Você pode executar `npm install` e `npm run dev` dentro do container para iniciar serviços, ou usar o terminal do VS Code conectado ao container.

4. Portas expostas no host:

- 3000: backend
- 5173: frontend
- 9229: node inspector (opcional)
- 3000: backend
- 5173: frontend
- 9229: node inspector (opcional)

Observações e segurança

- O socket Docker (`/var/run/docker.sock`) é montado dentro do container para permitir que ferramentas Docker (CLI) gerenciem containers/serviços. Isso tem implicações de segurança — não exponha a máquina a usuários não confiáveis.
- Se preferir uma imagem com Node.js pré-instalada, edite `.devcontainer/devcontainer.json` para adicionar features (já existe um devcontainer.json na pasta que aponta para o serviço `backend`).

Problemas comuns

- Se a extensão Remote - Containers não listar `xrat-devcontainer`, verifique `docker ps` e confirme que o container está em execução.
- Se precisar de um usuário não-root dentro do container, podemos adicionar um `Dockerfile` em `.devcontainer` e ajustar o `docker-compose.yml` para usar uma build local.

Quer que eu gere também um pequeno `.devcontainer/Dockerfile` com Node.js 20 e utilitários (git, openssh, curl)? Posso adicionar e ajustar o compose para usar build instead of image.
