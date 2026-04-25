# Auto-Invest AI Vault — CLAUDE.md

## Proje Özeti

**Auto-Invest AI Vault** — kullanıcının cüzdanındaki fonları AI analizi ile otomatik olarak DeFi protokollerine yönlendiren otonom Web3 yatırım sistemi.

**Core Mantık:**
```
AI → karar üretir
Backend Executor → işlemi başlatır
Smart Contract → kuralları kontrol eder
Blockchain → işlemi uygular
```

---

## Sistem Mimarisi

```
User (MetaMask)
  └─► Vault Smart Contract
        └─► Policy (kurallar)
              └─► Backend Executor
                    └─► AI Engine (OpenAI)
                          └─► Mock Aave
```

**Önemli:** AI para transfer etmez. Sadece analiz yapar ve öneri üretir. Transferi Backend Executor başlatır, Smart Contract kurallarla sınırlar, Blockchain uygular.

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Smart Contract | Solidity 0.8.28, Hardhat 3, OpenZeppelin |
| Frontend | React / Next.js |
| Wallet | MetaMask, ethers.js |
| Backend | Node.js (cron job + executor) |
| AI | OpenAI API |
| Test Network | Sepolia / Base |
| Test Tokens | Mock USDC, Mock Aave |

---

## Proje Yapısı

```
auto-investor-ai-bot/
├── contracts/          # Solidity smart contracts (Hardhat 3)
│   ├── hardhat.config.ts
│   ├── package.json
│   └── (contracts/, scripts/, test/ henüz oluşturulmadı)
├── frontend/           # React/Next.js dashboard (henüz yok)
├── backend/            # Node.js executor + cron (henüz yok)
├── ai/                 # OpenAI entegrasyonu (henüz yok)
└── MVPDoc.md
```

---

## Smart Contract Kuralları

Vault contract'ın zorunlu policy alanları:

| Alan | Açıklama |
|------|----------|
| `maxSingleInvestment` | Tek seferde yatırılabilecek max miktar |
| `monthlyLimit` | Aylık toplam yatırım limiti |
| `minReserve` | Cüzdanda kalması gereken minimum miktar |
| `allowedTokens` | İzin verilen token listesi (USDC, ETH) |
| `allowedProtocols` | İzin verilen protokoller (Mock Aave) |
| `autoInvestEnabled` | Otomatik yatırım açık/kapalı |
| `onlyExecutor` | Sadece yetkili executor çağırabilir |
| `pause` | Emergency stop mekanizması |

---

## Risk Seviyeleri

| Seviye | Strateji |
|--------|----------|
| LOW | Sadece USDC → Aave yield |
| MEDIUM | %80 USDC + %20 ETH (simulated) |

**Asset Scope:** USDC (düşük risk), ETH (orta risk, simülasyon)

---

## MVP Kapsamı

- [ ] Vault contract
- [ ] Policy sistemi
- [ ] Deposit / Withdraw
- [ ] Auto-invest
- [ ] AI entegrasyonu
- [ ] Mock Aave
- [ ] Dashboard
- [ ] Emergency stop

---

## Geliştirme Kuralları

### Smart Contracts
- Tüm kontratlar `contracts/contracts/` altında
- Her kontrat için `contracts/test/` altında test yazılmalı
- OpenZeppelin kütüphanelerini kullan (`Ownable`, `Pausable`, `ReentrancyGuard`)
- Deployment scriptleri `contracts/scripts/` altında
- Hardhat 3 native TypeScript kullan, plugin gerektirmez

### Backend
- Backend executor bir Node.js cron job'dur
- AI'dan gelen öneriyi smart contract'a iletir
- Backend cüzdan private key'i env variable olarak tutmalı, asla commit edilmemeli

### Frontend
- Next.js App Router kullan
- MetaMask bağlantısı için `ethers.js` veya `viem`
- Dashboard: bakiye, risk seviyesi, yatırım geçmişi, emergency stop butonu

### AI
- OpenAI API ile harcama analizi ve tasarruf hesaplama
- AI sadece JSON formatında öneri döner, işlem yapmaz
- Öneri formatı: `{ action: "invest", amount: number, token: "USDC", protocol: "aave" }`

---

## Güvenlik Zorunlulukları

- Private key ve API key'ler `.env` dosyasında, asla commit edilmemeli
- Her dizinde `.gitignore` → `node_modules/`, `.env`, `artifacts/`, `cache/`
- Smart contract'larda `onlyExecutor` modifier her kritik fonksiyonda olmalı
- `pause()` / `unpause()` her zaman owner-only
- Kullanıcı fonları asla backend veya AI tarafından doğrudan erişilememeli

---

## Test Ağı

- **Sepolia** veya **Base** testnet kullan
- Mock USDC ve Mock Aave kontratları deploy edilecek
- Gerçek para kullanılmayacak — tüm MVP simülasyon üzerinde çalışır

---

## Roadmap (MVP Sonrası)

1. Uniswap swap entegrasyonu
2. Gerçek Aave protokolü
3. Open Banking bağlantısı
4. Tokenized assets desteği
