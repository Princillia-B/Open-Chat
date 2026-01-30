<!-- JS -->
<script>
    import Icon from "@iconify/svelte";
    import "./app.css";
    import { onMount } from "svelte";
    const {
        question,
        response,
        message,
        sendQuestion,
        activeConversationId,
        onTitleGenerated,
        resetChatKey,
    } = $props();

    /*--- Ajout des URLs et clé API ---*/
    const API_URL = import.meta.env.VITE_MISTRAL_URL;
    const API_KEY = import.meta.env.VITE_MISTRAL_KEY;

    /*--- Variables de lecture des message*/
    let userMessage = $state("");

    /*--- Variable de lecture d'un titre déjà généré*/
    let titleAlreadyGenerated = false;

    /*--- Tableau contenant l'historique des anciens messages ---*/
    let conversations = $state([]);

    /*--- Variable de chargement ---*/
    let loading = $state(false);
    let error = "";

    /*--- Ajouter le message dans le chat---*/
    async function handleSubmit(event) {
        event.preventDefault();
        sendMessage();
    }

    /*--- Envoyer le message à l'API Mistral ---*/
    async function sendMessage() {
        // Je copie le message de l'User pour qu'il soit envoyé à l'API puis je le vide
        const userMessageCopy = userMessage;
        userMessage = "";

        // On va détecter si ce message est le premier, si c'est le premier on crée un id, sinon on garde celui qui est présent
        const isFirstMessage = activeConversationId === null;
        if (isFirstMessage && !titleAlreadyGenerated) {
            titleAlreadyGenerated = true;

            const rawTitle = await generateConversationTitle(userMessageCopy);
            const title = normalizeTitle(rawTitle);

            onTitleGenerated(title);
        }

        

        //Envoi du userMessage à l'API PocketBAse
        await fetch("http://127.0.0.1:8090/api/collections/O_Chat/records", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                role: "user",
                content: userMessageCopy,
                conversation: activeConversationId,
            }),
        });

        //Le chargement
        loading = true;

        try {
            const response = await fetch(
                "https://api.mistral.ai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "mistral-large-latest",
                        messages: [
                            {
                                role: "user",
                                content: userMessageCopy,
                            },
                        ],
                    }),
                },
            );

            //On vérifie le statut de la réponse (succès 200 /erreur 400)
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur API ${response.status}: ${errorText}`);
            }
            // Si la réponse est ok
            const data = await response.json();

            // Récupérér la réponse de l'ia à partir de ma variable aiMessage
            const aiMessage = data.choices[0].message.content;

            //Envoi du aiMessage à l'API PocketBAse
            await fetch(
                "http://127.0.0.1:8090/api/collections/O_Chat/records",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        role: "ai",
                        content: aiMessage,
                        conversation: activeConversationId,
                    }),
                },
            );

            // Recharger l'historique apres l'envoi
            await chatHistory();
        } catch (error) {
            console.error(error);
        } finally {
            loading = false;
        }
    }

    /*--- Récupérer l'historique des conversations ---*/
    async function chatHistory() {
        // 0. Si aucune conversation n'est active, on vide le chat
        if (!activeConversationId) {
            conversations = [];
            return;
        }

        // 1. Appeler l’API en filtrant par conversation active
        const response = await fetch(
        `http://127.0.0.1:8090/api/collections/O_Chat/records?filter=(conversation='${activeConversationId}')&sort=created`,
    );

        // 2. Attendre la réponse et la convertir en JSON
        const data = await response.json();

        // 3. Récupérer uniquement les messages de cette conversation
        conversations = data.items;
    }

    // Dire à Svelte de démarrer l'historique dès l'apparition du Front
    onMount(async () => {
        await chatHistory();
    });

    /*--- Fonction pour que Mistral génère un titre */
    async function generateConversationTitle(firstMessage) {
        const response = await fetch(
            "https://api.mistral.ai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${API_KEY}`,
                },
                body: JSON.stringify({
                    model: "mistral-large-latest",
                    messages: [
                        {
                            role: "system",
                            content:
                                "Génère un titre très court (3 à 6 mots). Réponds uniquement par le titre, sans guillemets, sans ponctuation.",
                        },
                        {
                            role: "user",
                            content: firstMessage,
                        },
                    ],
                    temperature: 0.2, //temperature permet de fixer le niveau de créativité de l'IA dans ces réponses
                    max_tokens: 20, // pour limiter le nmb de caractères du titre
                }),
            },
        );

        const data = await response.json();
        const aiTitle = data?.choices?.[0]?.message?.content;

        return aiTitle;
    }

    // Fonciton de normalisation pour enlever les guillets, points ety retour à la ligne des titres
    function normalizeTitle(rawTitle) {
        if (!rawTitle || typeof rawTitle !== "string") {
            return "Nouvelle conversation";
        }

        return rawTitle
            .replace(/[".]/g, "") // enlève guillemets et points
            .replace(/\n/g, " ") // enlève retours ligne
            .trim();
    }

    /* Déclencher le reset du chat */
    $effect(() => {
        resetChatKey;
        conversations = [];
        titleAlreadyGenerated = false;
    });

    /* Déclencher le bouton de chat pour avoir l'historique */
    $effect(() => {
    if (activeConversationId) {
        chatHistory();
    }
});
</script>

<!-- HTML -->
<main class="chat-container">
    <div class="messages">
        {#each conversations as conversation}
            {#if conversation.role === "user"}
                <div class="user-question">{conversation.content}</div>
            {:else}
                <div class="ia-response">{conversation.content}</div>
            {/if}
        {/each}

        {#if loading}
            <div class="ia-response">
                <div class="loading-icon">
                    <Icon icon="eos-icons:loading" width="40" height="40" />
                </div>
            </div>
        {/if}
    </div>

    <form class="question-container" onsubmit={handleSubmit}>
        <label for="ask-question"></label>
        <textarea placeholder="Posez une question" bind:value={userMessage}
        ></textarea>
        <button
            class="send-question"
            type="submit"
            disabled={!userMessage.trim() || loading}
        >
            Envoyé
        </button>
    </form>
</main>

<!--CSS-->
<style>
    .chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        padding: 1rem;
    }

    .messages {
        flex: 1;
        overflow-y: auto;
    }

    .user-question,
    .ia-response,
    .question-container {
        background-color: var(--secondary-color);
        border: 0.1rem solid transparent;
        border-radius: 1rem;
        padding: 0.6rem 1.2rem;
        margin-bottom: 2rem;
        font-size: 1rem;
        box-sizing: border-box;
        white-space: pre-wrap;
        overflow-wrap: break-word;
    }

    .user-question {
        color: var(--third-color);
        text-align: right;
    }

    textarea {
        appearance: none;
        border: none;
        outline: none;
        background: transparent;
        color: var(--primary-color);
        padding: 0 1rem;
        font-family: var(--font-family);
        font-size: 1rem;
        size: inherit;
        width: 100%;
        box-sizing: border-box;
        resize: none;
        white-space: pre-wrap;
        overflow-wrap: break-word;
    }

    .question-container {
        display: flex;
        padding: 1rem 0;
        position: sticky;
        bottom: 0;
        box-shadow: 10px 10px 5px #000000;
    }

    .send-question {
        margin: 0 1rem 0 auto;
        background-color: transparent;
        border: none;
        padding: 0.8rem;
        font-family: var(--font-family);
        font-size: 1rem;
        color: var(--primary-color);
    }

    .send-question:hover {
        color: var(--third-color);
        cursor: pointer;
    }

    .send-question:disabled {
        cursor: not-allowed;
        color: var(--primary-color);
    }

    .loading-icon {
        display: flex;
        justify-content: center;
    }
</style>
