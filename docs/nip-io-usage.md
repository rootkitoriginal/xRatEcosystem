# Usando o sistema nip.io no xRat Ecosystem

O projeto xRat Ecosystem está configurado para usar o serviço [nip.io](https://nip.io), que é um serviço de DNS wildcard gratuito. Isso permite que você acesse os diferentes serviços usando nomes de domínio ao invés de IPs e portas.

## Endereços nip.io disponíveis

Com a configuração atual, você pode acessar os serviços através dos seguintes endereços:

- **Backend API**: [http://172.28.1.30_3000.nip.io](http://172.28.1.30_3000.nip.io)
- **Frontend**: [http://172.28.1.40_5173.nip.io](http://172.28.1.40_5173.nip.io)
- **Nginx**: [http://172.28.1.50_80.nip.io](http://172.28.1.50_80.nip.io)

## Como funciona o nip.io

O nip.io é um serviço de DNS wildcard que permite mapear qualquer endereço IP para um nome de domínio sem precisar configurar um servidor DNS próprio. O formato usado é:

```text
<ip-address>_<porta>.nip.io
```

Por exemplo, `172.28.1.30_3000.nip.io` aponta para o IP 172.28.1.30 na porta 3000.

## Benefícios do uso do nip.io

1. **Mais fácil de lembrar** - Usar nomes em vez de IPs torna o acesso mais fácil
2. **Facilidade para CORS** - Os navegadores tratam domínios diferentes (mesmo que apontem para o mesmo IP) como origens diferentes
3. **SSL e certificados** - Facilita a configuração de certificados SSL para desenvolvimento
4. **Desenvolvimento local** - Permite simular um ambiente mais próximo da produção

## Como testar a conexão

Você pode testar a conexão usando o comando `ping` ou `curl`:

```bash
ping 172.28.1.30_3000.nip.io
curl http://172.28.1.30_3000.nip.io/health
```

## Solução de problemas

Se você tiver problemas para acessar os serviços através dos endereços nip.io:

1. Verifique se os serviços Docker estão em execução:

   ```bash
   docker-compose ps
   ```

2. Verifique se os IPs estáticos foram atribuídos corretamente:

   ```bash
   docker network inspect xrat-network
   ```

3. Teste a resolução DNS:

   ```bash
   nslookup 172.28.1.30_3000.nip.io
   ```

4. Se estiver usando VPN ou proxy, desative-os temporariamente para testar.
