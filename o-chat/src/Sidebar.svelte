<!-- JS -->
<script>
    import Icon from "@iconify/svelte";
    import "./app.css";
    const {
        title,
        subtitle,
        primaryLabel,
        secondaryLabel,
        thirdLabel,
        logOut,
        onNewConversation,
        conversations = [],
    } = $props();

    /* Variable pour le titre de la conversation */
    let conversationTitle = $state("");

    /* Ouverture et fermeture de la siderbar */
    let sidebarClosed = $state(false);
    function toggleSidebar() {
        sidebarClosed = !sidebarClosed;
    }

    /* Clique bouton de déconnexion Token */
    function logOutTokenClick() {
        logOut();
    }
    function newConversationClick() {
        onNewConversation();
    }
</script>

<!-- HTML -->
<header class="sidebar" class:closed={sidebarClosed}>
    <!-- ajoute la class closed à header si sidebarClosed= true -->
    <section class="section-top">
        <h1>
            {title}
            <button class="btn-sidebar-icon" onclick={toggleSidebar}>
                <Icon icon="f7:sidebar-left" width="20" height="20" />
            </button>
        </h1>
        <button class="btn-burger-menu-icon" onclick={toggleSidebar}>
            <Icon
                icon="qlementine-icons:menu-burger-16"
                width="20"
                height="20"
            />
        </button>
        <button class="btn-new-chat" onclick={newConversationClick}>
            {primaryLabel}
            <div class="btn-add-icon">
                <Icon icon="icons8:plus" width="20" height="20" />
            </div>
        </button>
        <h2>{subtitle}</h2>
        {#each conversations as conversation}
            <ul class="conversation-list">
                <li class="conversation-item">
                    {conversation.title}
                </li>
                <div class="btn-trash-icon">
                    <Icon
                        icon="famicons:trash-outline"
                        width="20"
                        height="20"
                    />
                </div>
            </ul>
        {/each}
    </section>
    <section class="section-bottom">
        <button class="btn-log-out" onclick={logOutTokenClick}>
            {thirdLabel}
            <div class="log-out-icon">
                <Icon
                    icon="material-symbols:logout-rounded"
                    width="20"
                    height="20"
                />
            </div>
        </button>
    </section>
</header>

<!-- Boutons apparaîssent quand la sidebar est fermée -->
{#if sidebarClosed}
    <div class="sidebar-open-additionnals-btn">
        <button class="btn-closed-sidebar" onclick={toggleSidebar}>
            <Icon icon="f7:sidebar-right" width="20" height="20" />
        </button>
        <button class="btn-add-open-sidebar">
            <Icon icon="icons8:plus" width="20" height="20" />
        </button>
        <button class="btn-chat-open-sidebar" onclick={toggleSidebar}>
            <Icon icon="mdi:chat-outline" width="20" height="20" />
        </button>
        <button class="btn-log-out" onclick={logOutTokenClick}>
            <Icon
                icon="material-symbols:logout-rounded"
                width="20"
                height="20"
            />
        </button>
    </div>
{/if}

<!-- CSS -->
<style>
    .section-top {
        padding: 1rem;
    }
    .sidebar {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100dvh;
        width: 30dvh;
        border-right: 0.2rem solid var(--secondary-color);
        transform: translateX(0);
        transition: transform 0.25s ease;
        background-color: #000000;
    }

    .sidebar.closed {
        transform: translateX(-80%);
    }

    .sidebar-open-additionnals-btn {
        position: fixed;
        top: 1rem;
        left: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .btn-closed-sidebar,
    .btn-add-open-sidebar,
    .btn-chat-open-sidebar {
        background-color: var(--secondary-color);
        color: var(--primary-color);
        border: 0.1rem solid transparent;
        border-radius: 0.5rem;
        padding: 0.5rem;
        cursor: pointer;
    }

    .btn-closed-sidebar:hover,
    .btn-add-open-sidebar:hover,
    .btn-chat-open-sidebar:hover {
        border-color: var(--third-color);
    }

    .btn-add-icon {
        margin-left: 1rem;
    }

    h1 {
        font-weight: 500;
        display: flex;
        justify-content: space-between;
        width: 75%;
    }
    .btn-sidebar-icon {
        cursor: pointer;
        color: var(--primary-color);
        background-color: transparent;
        border: none;
    }

    .btn-sidebar-icon:hover {
        color: var(--third-color);
    }

    .btn-burger-menu-icon {
        display: none;
        color: var(--primary-color);
        background-color: transparent;
        border: none;
    }

    h2 {
        font-weight: 400;
        font-size: 1.2rem;
    }

    .btn-new-chat,
    .conversation-list {
        color: var(--primary-color);
        border: 0.1rem solid transparent;
        border-radius: 1rem;
        padding: 0.6rem 1.2rem;
        font-size: 1rem;
        font-weight: 500;
        font-family: inherit;
        background-color: transparent;
        cursor: pointer;
        display: flex;
        gap: 1rem;
        outline: none;
    }

    .conversation-list {
        display: flex;
        justify-content: space-between;
        margin-right: 4rem;
    }

    .conversation-item {
        list-style-type: none;
    }

    .btn-log-out {
        color: var(--primary-color);
        border: 0.1rem solid transparent;
        border-radius: 0.5rem 0.5rem 0 0;
        padding: 0.6rem 1.2rem;
        font-size: 1rem;
        font-weight: 500;
        font-family: inherit;
        background-color: transparent;
        cursor: pointer;
        display: flex;
        gap: 1rem;
        outline: none;
    }

    .conversation-list,
    .btn-log-out {
        background-color: var(--secondary-color);
    }

    .btn-new-chat:hover,
    .conversation-list:hover,
    .btn-log-out:hover {
        border-color: var(--third-color);
    }

    .section-bottom {
        width: 100%;
    }

    .btn-log-out {
        width: 100%;
        display: flex;
        justify-content: center;
    }

    /* Responsive Mobilie */
    @media screen and (max-width: 576px) {
        .sidebar {
            border-right: none;
            border-bottom: 0.2rem solid var(--secondary-color);
            width: 100%;
            margin: 0 0 4rem;
            display: flex;
            justify-content: space-between;
            block-size: initial;
        }

        .sidebar.closed {
            transform: translateX(90%);
        }

        .btn-sidebar-icon,
        h2,
        .btn-new-chat,
        .conversation-list,
        .btn-log-out {
            display: none;
        }

        .btn-burger-menu-icon {
            display: flex;
            order: 1;
            align-items: center;
            color: var(--primary-color);
        }

        h1 {
            order: 2;
        }
    }
</style>
