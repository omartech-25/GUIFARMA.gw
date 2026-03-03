# Instruções de Hospedagem - GUIFARMA SA

Este projeto foi preparado para ser hospedado tanto no **Vercel** quanto no **XAMPP**.

## 1. Hospedagem no Vercel (Frontend apenas)

O Vercel é ideal para hospedar a interface React.

1. Conecte seu repositório ao Vercel.
2. O Vercel detectará automaticamente as configurações do Vite.
3. O arquivo `vercel.json` já está configurado para lidar com as rotas do Single Page Application (SPA).
4. **Nota:** O backend PHP não funcionará nativamente no Vercel sem configurações adicionais (Serverless Functions).

## 2. Hospedagem no XAMPP (Frontend + Backend PHP)

Para rodar o sistema completo com banco de dados no XAMPP:

### Passo 1: Preparar os arquivos
1. Execute o comando de build no seu terminal:
   ```bash
   npm run build
   ```
2. Uma pasta chamada `dist` será gerada.

### Passo 2: Configurar no XAMPP
1. Copie todo o conteúdo da pasta `dist` para `C:\xampp\htdocs\gyuifarma` (ou o diretório equivalente no seu sistema).
2. O arquivo `.htaccess` incluído garantirá que as rotas do React funcionem corretamente no Apache.

### Passo 3: Configurar o Banco de Dados
1. Abra o **phpMyAdmin** (`http://localhost/phpmyadmin`).
2. Crie um novo banco de dados chamado `medstock`.
3. Importe o arquivo `medstock.sql` (que estará na raiz da sua pasta no XAMPP após o build).
4. Verifique as configurações de conexão em `config.php`.

### Passo 4: Acessar o sistema
1. Acesse `http://localhost/gyuifarma` no seu navegador.

---

**Dica:** Se você for usar um domínio ou subpasta diferente, certifique-se de ajustar o `base` no `vite.config.ts` se necessário.
