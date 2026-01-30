<!--JS-->
<script>
  import Chat from "./Chat.svelte";
  import Sidebar from "./Sidebar.svelte";
  import PocketBase from "pocketbase"; //importer pocketbase dans le front
  import { onMount } from "svelte";

  /* Reprise des éléments HTML*/
  const sidebarElements = {
    title: "OpenChat",
    subtitle: "Vos Chats",
    primaryLabel: "Nouvelle Conversation",
    secondaryLabel: "Titre de la conversation",
    thirdLabel: "Déconnexion",
  };

  const chatElements = {
    question: "",
    response: "Réponse de l'IA",
    message: "",
    sendQuestion: "Envoyé",
  };

  /*-- Variable lecture Token ---*/
  let userToken = $state("");

  /*--- Sécuriser mon Token Mistral avec LocalStorage ---*/
  let token = $state(null);
  token = localStorage.getItem("authToken");

  /*--- Variable permettant de lier le front à PocketBase ---*/
  const pb = new PocketBase("http://127.0.0.1:8090");
  let conversations = $state([]); // pour stocker les conversations

  /*--- Variables de conversation ---*/
  // Variable permettant de savoir si la conversaiton est active ou
  let activeConversationId = $state(null); // null = aucune conversation active

  //Variable de titre en attente (pour stocker le titre) et varibel de création de conversation
  let waitingConversationTitle = $state(null);
let isCreatingConversation = $state(false);

$effect(() => {
  const shouldCreateConversation =
    activeConversationId === null &&
    !!waitingConversationTitle &&
    !isCreatingConversation;

  if (shouldCreateConversation) {
    console.log("🟢 Conditions OK → création de la conversation à lancer");
  } else {
    console.log("🔵 Pas de création :", {
      activeConversationId,
      waitingConversationTitle,
      isCreatingConversation,
    });
  }
});

  /* --- fonction permettant de gérer le clic du bouton envoyer*/
  async function handleSubmit(event) {
    event.preventDefault();
  }

  /*--- Envoyer le Token Mistral à Mistral ---*/
  async function sendMessage() {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      }),
    });

    //On vérifie le statut de la réponse (succès 200 /erreur 400)
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API ${response.status}: ${errorText}`);
    }
    const data = await response.json();
  }

  /*--- Fonction de validation du Token ---*/
  async function validateToken() {
    try {
      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            model: "mistral-large-latest",
            messages: [{ role: "user", content: "hello" }],
            max_tokens: 1, // pour limiter la réponse au strict minimum
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Clé API invalide"); //Pour le code
      }

      // Enregistre la clé API validée dans le localStorage et met à jour l'appli
      localStorage.setItem("authToken", userToken);
      token = userToken;
      //vider l'input une fois qu'on a le token
      userToken = "";
    } catch (error) {
      alert("Clé API invalide"); // Pour l'user
      //vider l'input une fois qu'on a le token
      userToken = "";
    }
  }

  /*--- Deconnexion du token ---*/
  function logOutToken() {
    localStorage.removeItem("authToken");
    token = null;
  }

  /*--- Récupérer les conversations ---*/
  async function getConversations() {
    const result = await pb.collection("conversations").getFullList(); // code de Pocketbase permettant de get conversation (voir dans </>API Preview

    conversations = result; //Stocker les conversations dans PocketBase
  }

  // Dire à Svelte de démarrer la récupération des anciennes conversations sauvegardées dès l'apparition du Front
  onMount(async () => {
    await getConversations();
  });

  /*--- Générer un titre automatiquement à partir du premier message (générer par Mistral)---*/
  async function generateConversationTitle(firstUserMessage, userToken) {
    // si le token est différenty de l'usertoken alors on stoppe
    if (!userToken) {
      return;
    }

    const iaPrompt =
      "Génères des titres de conversation. Réponds uniquement par un titre très court (3 à 6 mots), sans guillemets, sans point final, sans emoji."; //l'IA va lire cette prhase pour comprendre comment générer ces titres

    const userPrompt = `Message utilisateur:\n${firstUserMessage}\n\nTitre:`; //Message de l'utilisateur = saut de ligne + first user message + sauts de lignes (comme <br><br>) + titre (je montre le message l'IA et je lui dis de me donner un titre)

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: iaPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2, //temperature permet de fixer le niveau de créativité de l'IA dans ces réponses
        max_tokens: 20, // pour limiter le nmb de caractères du titre
      }),
    });

    //On vérifie le statut de la réponse (succès 200 /erreur 400)
    if (!response.ok) {
      const errorText = await response.text();
      return;
    }

    // Si la réponse est ok
    const data = await response.json(); //rappel : fetch donne une réponse en HTTP il faut la converir en json pour que ça deviennent un objet JS visible sur le dom

    // Récupérér le titre de l'ia à partir de ma variable ai Title
    const aiTitle = data?.choices?.[0]?.message?.content;
    return aiTitle;
  }

  onMount(() => {
    generateConversationTitle("Comment connecter PocketBase à Svelte", token);
  });

  /*--- Créer la conversation dans PocketBase avec le titre généré --- */
  async function createConversationInPocketBase(title) {
    console.log("🛠 Création de la conversation avec le titre :", title);

  isCreatingConversation = true;

  try {
    const created = await pb.collection("conversations").create({
      title: title,
    });

    console.log("✅ Conversation créée :", created);

    return created.id;
  } catch (error) {
    console.error("❌ Erreur création conversation :", error);
    return null;
  } finally {
    isCreatingConversation = false;
  }
}

</script>

<!--HTML-->
<!--Gestion HTML du Token-->
{#if token === null}
  <section class="card">
    <form class="add-token-form" onsubmit={handleSubmit}>
      <h1 class="title">OpenChat</h1>
      <label for="add-token-lable"></label>
      <input
        type="text"
        placeholder="Entrez votre Token Mistral"
        bind:value={userToken}
      />
      <button type="submit" class="btn-valid" onclick={validateToken}
        >Valider</button
      >
      <!--  Permet d'enregistrer le token dans le local storage sous la clé authToken + une fois que c'est fait il faut mettre token à jour selon le token de l'utilisateur-->
    </form>
  </section>
{:else}
  <div class="app">
    <Sidebar
      title={sidebarElements.title}
      subtitle={sidebarElements.subtitle}
      primaryLabel={sidebarElements.primaryLabel}
      secondaryLabel={sidebarElements.secondaryLabel}
      thirdLabel={sidebarElements.thirdLabel}
      logOut={logOutToken}
      {conversations}
    />

    <Chat
      question={chatElements.question}
      response={chatElements.response}
      message={chatElements.message}
      sendQuestion={chatElements.sendQuestion}
      {activeConversationId}
      onTitleGenerated={(title) => (waitingConversationTitle = title)}
    />
  </div>
{/if}

<!--CSS-->
<style>
  .card {
    height: 100dvh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    background-color: var(--secondary-color);
    border-radius: 0.8rem;
    box-shadow: 10px 10px 5px #000000;
    padding: 5rem;
    width: 5rem;
  }

  input {
    background-color: var(--primary-color);
    outline: none;
    color: var(--secondary-color);
    padding: 0 1rem;
    font-family: var(--font-family);
    font-size: 1rem;
    height: 2rem;
    border: none;
    border-radius: 0.2rem;
  }

  .btn-valid {
    background-color: var(--secondary-color);
    padding: 0.8rem;
    font-family: var(--font-family);
    font-size: 1rem;
    color: var(--primary-color);
    border-radius: 0.4rem;
    border: none;
    box-shadow: 0.2rem 0.2rem 1rem #000000;
  }

  .btn-valid:hover {
    background-color: var(--third-color);
    cursor: pointer;
    color: var(--secondary-color);
  }

  /*--- Version Mobile ---*/
  @media screen and (max-width: 576px) {
    .app {
      display: flex;
      flex-direction: column;
    }
  }
</style>
