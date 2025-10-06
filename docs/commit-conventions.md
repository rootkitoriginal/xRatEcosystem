# Convenções de Commits e Processo de Desenvolvimento

Este documento descreve as convenções de commits e o processo de desenvolvimento seguidos neste projeto.

## Convenções de Commits

Este projeto segue o padrão [Conventional Commits](https://www.conventionalcommits.org/) para mensagens de commit.

### Formato Básico

```text
<tipo>(<escopo opcional>): <descrição>

<corpo opcional>

<rodapé opcional>
```

### Tipos de Commits

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (sem alteração de código)
- `refactor`: Refatoração de código
- `test`: Adição ou correção de testes
- `chore`: Alterações em processos de build, ferramentas, etc.
- `perf`: Melhorias de performance
- `ci`: Alterações na configuração de CI

### Exemplos

```bash
feat(auth): adicionar validação de token JWT
```

```bash
fix(data): corrigir erro na ordenação de resultados

A ordenação estava invertida devido a um comparador incorreto.
Isso resolve o issue #123.
```

```bash
docs: atualizar documentação de instalação
```

## Processo de Pre-commit

Ao tentar fazer um commit, o hook de pre-commit verifica automaticamente:

1. Detecção de segredos expostos
2. Formatação de código com Prettier
3. Correção de erros de lint
4. Verificação da mensagem de commit (padrão Conventional Commits)

## Fluxo de Branches

- `main`: Branch principal, estável
- `feature/*`: Novas funcionalidades
- `fix/*`: Correções de bugs
- `docs/*`: Atualizações de documentação
- `refactor/*`: Refatoração de código
- `test/*`: Adição ou melhoria de testes
- `chore/*`: Atualizações de ferramentas, dependências, etc.
- `copilot/*`: Branches criadas pelo GitHub Copilot
- `dependabot/*`: Branches automáticas do Dependabot

## Verificações em Pull Requests

Ao abrir um Pull Request, as seguintes verificações são executadas automaticamente:

1. Verificação do título do PR (deve seguir o padrão Conventional Commits)
2. Verificação do nome da branch
3. Verificação de qualidade de código
   - Busca por `console.log` em código de produção
   - Busca por comentários `TODO` e `FIXME`
4. Verificação de cobertura de testes
5. Verificação de tamanho do bundle
6. Rotulagem automática do PR com base nos arquivos modificados

## Resolução de Problemas

Se o hook de pre-commit falhar:

1. Verifique os erros reportados
2. Corrija os problemas
3. Adicione as alterações (`git add .`)
4. Tente o commit novamente

Para pular as verificações em casos excepcionais (não recomendado):

```bash
git commit --no-verify -m "mensagem"
```
