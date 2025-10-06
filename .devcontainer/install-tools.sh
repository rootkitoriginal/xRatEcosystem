#!/bin/bash

# Script para instalar ferramentas adicionais no DevContainer
echo "🔧 Instalando ferramentas adicionais no xRat Ecosystem DevContainer..."

apt-get update -y


# Instalar Google Gemini CLI
echo ""
echo ""
echo ""
echo "📦 Instalando Google Gemini CLI..."
echo ""
echo ""
echo ""

sudo npm install -g @google/gemini-cli@latest

sudo apt install zsh
sudo chsh -s zsh

# Instalar GitHub CLI (gh)
echo "📦 Instalando GitHub CLI..."
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y

echo "✅ Instalação de ferramentas adicionais concluída!"
echo ""
echo ""
