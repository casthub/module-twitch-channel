module.exports = class extends window.casthub.module {

    /**
     * Initialize the new Module.
     */
    constructor() {
        super();

        /**
         * Whether the Form is currently loading/saving.
         *
         * @type {Boolean}
         */
        this._loading = false;

        /**
         * @type {HTMLElement}
         */
        this.$header = window.casthub.create('header');
        this.$header.icon = 'twitch';
        this.$header.innerText = 'Channel';
        this.$header.color = 'rgb(100, 65, 164)';
        this.addEl(this.$header);

        /**
         * @type {HTMLElement}
         */
        this.$form = document.createElement('form');
        this.$form.className = 'form';
        this.$form.method = 'POST';
        this.$form.action = '#!';
        this.$form.addEventListener('submit', e => {
            this.save();
            e.preventDefault();
        });
        this.addEl(this.$form);

        /**
         * @type {HTMLElement}
         */
        this.$inner = document.createElement('div');
        this.$inner.className = 'inner';
        this.$form.appendChild(this.$inner);

        /**
         * @type {HTMLElement}
         */
        this.$title = window.casthub.create('textfield');
        this.$title.className = 'input';
        this.$title.title = 'Title';
        this.$title.labelBackground = '#041326';
        this.$inner.appendChild(this.$title);

        /**
         * @type {HTMLElement}
         */
        this.$games = window.casthub.create('select');
        this.$games.className = 'input';
        this.$games.id = 'game';
        this.$games.title = 'Game';
        this.$games.labelBackground = '#041326';
        this.$games.filter = true;
        this.$games.visible = 1;
        this.$inner.appendChild(this.$games);

        /**
         * @type {HTMLElement}
         */
        this.$button = window.casthub.create('button');
        this.$button.className = 'input';
        this.$button.color = 'primary';
        this.$button.block = true;
        this.$button.textContent = 'Save Changes';
        this.$button.addEventListener('click', () => this.save());
        this.$form.appendChild(this.$button);

        // Set the Module CSS.
        this.css = `
            .module {
                display: flex;
                flex-direction: column;
            }

            .form {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                flex-shrink: 1;
                padding: 10px;
                padding-top: 15px;
            }

            .inner {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                flex-shrink: 1;
            }

            .input {
                display: block;
                width: 100%;
                margin-top: 15px;
            }

            .input:first-child {
                margin-top: 0;
            }
        `;
    }

    /**
     * Run any asynchronous code when the Module is mounted to DOM.
     *
     * @return {Promise}
     */
    async mounted() {
        await super.mounted();

        // Fetch initial games.
        const games = await this.fetchGames();
        this.$games.items = games.map(game => {
            return {
                value: game.name,
                text: game.name,
                image: game.box_art_url.replace('{width}', '30').replace('{height}', '40'),
            };
        });

        // Refresh for initial data.
        await this.refresh();
    }

    /**
     * Saves the current state of the info.
     *
     * @return {Promise}
     */
    async save() {
        if (this.loading) {
            return;
        }

        const { identity } = this.identity;
        this.loading = true;

        // PUT the selected Title & Game to Twitch.
        const { status, game } = await window.casthub.fetch({
            integration: 'twitch',
            method: 'PUT',
            url: `kraken/channels/${identity}`,
            data: {
                'channel[status]': this.$title.value,
                'channel[game]': this.$games.value,
            },
        });

        // Ensure we follow what Twitch tells us.
        this.$title.value = status;
        this.$games.value = game;

        // Reset the Form.
        this.loading = false;
        window.casthub.notify('Channel updated successfully');
    }

    /**
     * Fetches fresh data from the Twitch API.
     *
     * @return {Promise}
     */
    async refresh() {
        const response = await window.casthub.fetch({
            integration: 'twitch',
            method: 'GET',
            url: 'kraken/channel',
        });

        this.$title.value = response.status;
        this.$games.value = response.game;
    }

    /**
     * Fetches all of the available Games from Twitch recursively.
     *
     * @return {Promise}
     */
    async fetchGames() {
        const fetch = async (games = [], after = '') => {
            const { data, pagination } = await window.casthub.fetch({
                integration: 'twitch',
                method: 'GET',
                url: 'helix/games/top',
                data: {
                    after,
                    first: 100,
                },
            });

            games = [
                ...games,
                ...data,
            ];

            if (pagination.cursor) {
                return await fetch(games, pagination.cursor);
            }

            return games;
        };

        return await fetch();
    }

    /**
     * @return {Boolean}
     */
    get loading() {
        return this._loading;
    }

    /**
     * @param {Boolean} loading
     */
    set loading(loading) {
        this._loading = loading;
        this.$title.disabled = loading;
        this.$games.disabled = loading;
        this.$button.disabled = loading;
    }

};
