<!-- JS -->
<script>
    import Icon from "@iconify/svelte";
    import "./app.css";
    import { onMount } from "svelte";
    const { question, response, message, sendQuestion } = $props();

    /*--- Ajout des URLs et clé API ---*/
    const API_URL = import.meta.env.VITE_MISTRAL_URL;
    const API_KEY = import.meta.env.VITE_MISTRAL_KEY;

    /*--- Variables de lecture des message*/
    let userMessage = $state("");

    /*--- Tableau contenant l'historique des anciens messages ---*/
    let conversations = $state([]);

    /*--- Variable de chargement ---*/
    let loading = $state(false);
    let error = "";

    /*--- Ajouter le message dans le chat---*/
    async function handleSubmit(event) {
        // on bloque la soumission du formulaire
        event.preventDefault();
        sendMessage();
    }

    /*--- Envoyer le message à l'API Mistral ---*/
    async function sendMessage() {
        // Je copie le message de l'User pour qu'il soit envoyé à l'API puis je le vide
        const userMessageCopy = userMessage;
        userMessage = "";

        //Envoi du userMessage à l'API PocketBAse
        await fetch("http://127.0.0.1:8090/api/collections/O_Chat/records", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                role: "user",
                content: userMessageCopy,
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
        // 1. Appeler l’API
        const response = await fetch(
            `http://127.0.0.1:8090/api/collections/O_Chat/records`,
        );

        // 2. Attendre la réponse et la convertir en JSON
        const data = await response.json();

          //3. Récupérer tous les messages de l'objet data.items et les mettre dans un tableau appelé "conversations". Puis le trier dans l'ordre chronologique avec la fonction .sort()
        conversations = data.items.sort(
            (a, b) => new Date(a.created) - new Date(b.created),
        );
    }

    // Dire à Svelte de démarrer l'historique dès l'apparition du Front
    onMount(async () => {
        await chatHistory();
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
        <textarea
            placeholder="Posez une question"
            bind:value={userMessage}
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
