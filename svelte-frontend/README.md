# forest-svelte

Svelte reimplementation of forest-orb

## Developing

```sh
# to start locally
pnpm start

# to share to LAN
pnpm build
# allow vite thru ufw firewall if on linux
sufo ufw allow 4173 comment 'vite-preview'
pnpm preview --host
```
