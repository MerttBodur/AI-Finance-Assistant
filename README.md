25/05/26-26/06/26 tarihleri arasında Bi-ThonGo WEB3 Hackathon kapsamında 32 saatte geliştirildi.

# AI-Finance-Assistant

AI destekli, policy kontrollu, otonom Web3 yatirim asistani.

Kullanici fonlari Vault kontratinda tutulur. AI sadece oneride bulunur. Islemleri backend executor tetikler, smart contract kurallari zorunlu olarak uygular.

## Proje Ozeti

Auto-Invest AI Vault, kullanicinin belirledigi limitler ve risk seviyesine gore USDC fonlarini otomatik olarak yatirim akisina yonlendirir.

Core akis:

1. AI karar onerisi uretir.
2. Backend executor islemi tetikler.
3. Vault smart contract policy kurallarini kontrol eder.
4. Blockchain islemi uygular.

## Ozellikler

- AI tabanli invest/skip onerisi
- Policy tabanli guvenlik kontrolleri
- Otomatik cron tabanli executor dongusu
- Wallet baglantisi ile dashboard uzerinden yonetim
- Emergency stop (pause/unpause)

## Mimari

- `contracts/`: Solidity kontratlar, testler, deploy scriptleri
- `backend/`: Node.js executor, AI entegrasyonu, chain yazma/okuma
- `frontend/`: Next.js dashboard, wallet baglantisi, policy/deposit islemleri

## Kullanilan Teknolojiler

### Yazilim Dilleri

- TypeScript
- Solidity
- JavaScript (Node.js runtime)

### Yapay Zeka

- OpenAI API
- `gpt-4o-mini` (varsayilan model)

### Frontend

- React 18
- Next.js 14 (App Router)
- Tailwind CSS
- wagmi
- viem
- RainbowKit
- TanStack Query

### Backend

- Node.js
- TypeScript
- tsx
- node-cron
- OpenAI SDK
- viem
- dotenv

## Gereksinimler

- Node.js 20+
- npm 10+
- Base Sepolia RPC URL
- MetaMask
- WalletConnect Project ID
- OpenAI API key

## Kurulum

### 1) Repoyu klonla

```bash
git clone <REPO_URL>
cd auto-investor-ai-bot
```

### 2) Bagimliliklari kur

```bash
cd contracts && npm install
cd ../backend && npm install
cd ../frontend && npm install
cd ..
```

### 3) Environment dosyalarini hazirla

`contracts/.env`

```env
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
```

`backend/.env`

```env
EXECUTOR_PRIVATE_KEY=0xYOUR_EXECUTOR_PRIVATE_KEY
OPENAI_API_KEY=sk-...
VAULT_ADDRESS=0x...
USDC_ADDRESS=0x...
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
ACTIVE_USERS=0xUSER_ADDRESS
OPENAI_MODEL=gpt-4o-mini
```

`frontend/.env.local`

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_MOCK_AAVE_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=84532
```

## Smart Contract Derleme, Test ve Deploy

```bash
cd contracts
npm exec hardhat compile
npm exec hardhat test
npm exec hardhat run scripts/deploy.ts --network baseSepolia
```

Deploy sonrasinda yazdirilan adresleri `backend/.env` ve `frontend/.env.local` dosyalarina guncelle.

## Calistirma

### Backend executor

```bash
cd backend
npm run start
```

Beklenen log:

```text
[executor] started - cron every 2 min
```

### Frontend

```bash
cd frontend
npm run dev -- -p 3000
```

Dashboard:

- http://localhost:3000/dashboard

## Hizli Demo Akisi

1. Wallet bagla (Base Sepolia)
2. USDC mint et ve vault'a deposit yap
3. Policy belirle (`autoInvestEnabled=true`)
4. Executor cron dongusunde AI onerisi olusur
5. Uygunsa `autoInvest` islemi tetiklenir

## Test Komutlari

### Contracts

```bash
cd contracts
npm exec hardhat test
```

### Backend typecheck

```bash
cd backend
npm run typecheck
```

### Frontend typecheck ve build

```bash
cd frontend
npm run typecheck
npm run build
```

## Guvenlik Notlari

- Bu proje MVP ve demo amaclidir.
- API key ve private key degerlerini repoya commit etme.
- `PRIVATE_KEY` ve `EXECUTOR_PRIVATE_KEY` degerleri `0x` ile baslamali ve 64 hex karakter olmalidir.
- AI fon transfer etmez, sadece oneri uretir.

  ## Presentation

https://docs.google.com/presentation/d/1uZWcsGenG4Lw7gWF6Vr38K9O6RL5HnqV/edit?usp=sharing&ouid=112112600802115548358&rtpof=true&sd=true

 ## App Demo

 https://drive.google.com/file/d/16Tkum3yFaW7z91lPfvgUwIjZV3BVHd2P/view?usp=drivesdk

 ## Takim

- Mert Bodur
- Sercan Bakmaz
- Tarik Emre Ari


