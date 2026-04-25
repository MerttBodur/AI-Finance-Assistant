Auto-Invest AI Vault
Problem
Kullanıcılar finanslarını aktif yönetmek zorunda kalıyor, bu süreç zaman alıyor ve profesyonel destek maliyetli. Ayrıca tasarruf edilen fonlar verimli değerlendirilemiyor.

Çözüm
Kullanıcının yatırım için ayırdığı fonları, AI destekli analiz ile belirleyip, smart contract kuralları çerçevesinde otomatik olarak DeFi protokollerine yönlendiren otonom yatırım sistemi.

Ürün Tanımı
Auto-Invest AI Vault, kullanıcıların:

Tasarruf edilebilir miktarını analiz eden

Risk seviyesine göre yatırım stratejisi belirleyen

Ve bu yatırımları otomatik ve güvenli şekilde gerçekleştiren

bir Web3 finans asistanıdır.

Core Mantık
AI → karar üretir
Backend Executor → işlemi başlatır
Smart Contract → kuralları kontrol eder
Blockchain → işlemi uygular

Sistem Mimarisi
User (MetaMask)
→ Vault Smart Contract
→ Policy (kurallar)
→ Backend Executor
→ AI Engine
→ Mock Aave

Asset Scope
USDC → düşük risk
ETH → orta risk (simülasyon)

Risk Sistemi
LOW: sadece USDC, Aave yield
MEDIUM: %80 USDC, %20 ETH (simulated)

Smart Contract Rolü
maxSingleInvestment

monthlyLimit

minReserve

allowedTokens

allowedProtocols

autoInvestEnabled

onlyExecutor

pause (emergency stop)

Kullanıcı Akışı
Wallet bağlanır

USDC yatırılır

Risk seçilir

Limitler belirlenir

Auto-invest açılır

AI analiz yapar

Executor tetikler

Smart contract kontrol eder

USDC → Mock Aave

AI Rolü
Harcama analizi

Tasarruf hesaplama

Yatırım önerisi

AI para transfer etmez.

Otomasyon
Aylık döngü
Backend cron job tetikler

Tech Stack
Solidity, Hardhat, OpenZeppelin
React / Next.js
MetaMask
ethers.js
Node.js
OpenAI API
Sepolia / Base
Mock USDC
Mock Aave

MVP Scope
Vault contract

Policy sistemi

Deposit / Withdraw

Auto-invest

AI entegrasyonu

Mock Aave

Dashboard

Emergency stop

Roadmap
Uniswap swap

Gerçek Aave

Open Banking

Tokenized assets

Pitch
AI önerir, smart contract sınırlar, blockchain uygular.