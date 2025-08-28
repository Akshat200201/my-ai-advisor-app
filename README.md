
---

# AI Product Advisor

## 📌 Goal

This React Native application acts as an **AI Product Advisor**. Instead of relying on traditional keyword search, users can describe their needs in plain English, and the app intelligently recommends products from a provided catalog using a Generative AI model.

<p align="center">
  <img src="https://github.com/user-attachments/assets/81b8dcf1-a5cf-461a-b270-8e18e8173f1e" width="400" />
  <img src="https://github.com/user-attachments/assets/476cdcb8-455c-4d37-be9f-f36faff902d7" width="400" />
</p>




---

## 🛠️ Architecture

The project is structured as a **React Native Expo app** with the following layers:

* **UI Layer**
  Built using React Native + Expo components.

  * `AdvisorScreen.js`: Main screen where users enter queries.
  * Clean, minimal UI with input field, submit button, and results area.

* **Data Layer**

  * `PRODUCT_CATALOG`: A JavaScript array of objects that serves as the product database.

* **AI Integration Layer**

  * API call to OpenAI’s `chat/completions` endpoint (`gpt-4o-mini`).
  * User queries are passed as prompts along with the product catalog.
  * AI returns product recommendations and explanations.

* **Environment Management**

  * Sensitive data (API key) is stored in `.env`.
  * `.gitignore` excludes `.env` so secrets are never pushed to GitHub.
  * `process.env.EXPO_PUBLIC_OPENAI_API_KEY` is used in code.

---

## 🎨 Approach & Key Design Decisions

1. **Prompt Engineering**

   * Constructed a prompt that provides AI with both the **user query** and the **PRODUCT\_CATALOG**.
   * The AI compares user needs with product attributes to recommend the most relevant products.

2. **Security**

   * Initially, the API key was hardcoded (blocked by GitHub push-protection).
   * Migrated the key into `.env` and updated the code to load from environment variables.
   * Repo was cleaned using `git filter-repo` to remove API key from history.

3. **UX Decisions**

   * Kept UI minimal and intuitive.
   * Display includes **product name, description, and reasoning**.
   * Error handling: shows fallback messages if API fails.

4. **Code Quality**

   * Split responsibilities into separate files (`AdvisorScreen`, `PRODUCT_CATALOG`).
   * Used async/await for API calls with proper error handling.

---

## 📂 File Structure

```
ai-product-advisor/
│
├── assets/                 # App icons, splash screen
├── src/
│   ├── AdvisorScreen.js    # Main screen with AI logic & UI
│   ├── productCatalog.js   # Static product database
│
├── .env                    # Stores API key (ignored in Git)
├── .gitignore              # Prevents secrets & node_modules from being committed
├── app.json                # Expo app configuration
├── package.json            # Dependencies
├── README.md               # Documentation (this file)
```

---

## 🔄 Data Flow

1. User enters a **plain English query** (e.g., *“I need a lightweight laptop with long battery life”*).
2. App sends request to **OpenAI API** with the query + product catalog.
3. AI processes and selects relevant products.
4. App displays **product recommendations** and the **reason behind each suggestion**.

---

## 🚀 Running the Project

1. Clone the repository:

   ```bash
   git clone https://github.com/Akshat200201/my-ai-advisor-app.git
   cd my-ai-advisor-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Add your API key in a `.env` file:

   ```
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key_here
   ```

4. Start the app:

   ```bash
   npx expo start
   ```

---



---
