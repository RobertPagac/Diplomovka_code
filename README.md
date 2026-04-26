# Seamless Texture Generator

Tento návod slúži na sprevádzkovanie lokálneho generatívneho modelu FLUX.1. Vyberte si verziu podľa vašej konfigurácie RAM.

### 1. Príprava prostredia
- Nainštalujte [Node.js](https://nodejs.org/) (v18+)
- Nainštalujte [Python](https://www.python.org/) (3.10+)
1. Stiahnite si všetky súbory V ZIP formáte z tejto stánky (Zelené tlačítko Code hore) a rozbalte si ho niekde v počítači.
2. Na stránke https://huggingface.co/black-forest-labs/FLUX.1-schnell sa prihláste.
3. Uvidíte žltý box s podmienkami. Kliknite na "Agree and access repository".
4. Na stránke https://huggingface.co/settings/tokens sa znovu prihláste kliknite na Create new token, pomenujte ho, vytvorte a skopírujte.

### 2. Možnosť A: Plná Natívna Inštalácia (16GB RAM a viac)
*Priama inferencia pomocou knižníc `diffusers` bez proxy servera.*
1. V súbore **local_server.py** do riadku 19 vložte Váš token, ktorý ste si vytvorli v kroku 1.
2. V projekte nainštalujte Python závislosti: `pip install -r requirements.txt`
3. Stiahnite váhy modelu FLUX.1 priamo cez skript (skript si stiahne cca 30GB dát).
4. Spustite aplikáciu v režime natívnej integrácie.

### 2. Možnosť B: Server Proxy (Menej ako 16GB RAM)
*Optimalizované pre systémy s limitovanou pamäťou.*
1. Otvorte terminál v priečinku a nainštalujte závislosti: `pip install -r ../requirements.txt`
2. V súbore **server.py** do riadku 15 vložte Váš token, ktorý ste si vytvorli v kroku 1.
3. V terminály spustite server: `python server.py`
   - *Server pobeží na `http://127.0.0.1:5000`*

### 3. Nastavenie Frontend-u (React)
1. Otvorte nový terminál v priečinku. 
2. V koreňovom adresári: `npm install`
3. Spustite vývojový server: `npm run dev`
4. Aplikácia je dostupná na `http://localhost:3000`.
5. Gratulujem. Teraz môžete generovať bezšvové textúry na vašom zariadení.

---
