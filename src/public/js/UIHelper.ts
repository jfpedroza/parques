
import {Client} from "./Client";
import Timer = NodeJS.Timer;

export class UIHelper {

    private client: Client;

    private stage: number = 0;

    private content: JQuery;

    private loading: JQuery;

    private username: JQuery;

    private roomNameInput: JQuery;

    public constructor(client: Client) {
        this.client = client;
        this.content = $("#content");
        this.loading = $("#loading");
    }

    public configureEvents(): void {
        this.enterBtnClick();
        this.usernameTypingStopped();
        this.logOutBtnClick();
        this.newRoomBtnClick();
        this.editRoomNameBtnClick();
        this.roomNameTypingStopped();
        this.joinRoomBtnClick();
    }

    public setStage(stage: number, callback?: () => void): void {
        if (this.stage != stage) {
            this.stage = stage;
            this.setLoading(true);
            if (stage == 0) {
                this.content.html('');
            } else {
                this.content.load(`stages/stage${this.stage}.html`, () => {
                    console.log(`Stage ${this.stage} loaded`);
                    this.setLoading(false);
                    this.onStageChange();
                    if (callback) callback();
                });
            }
        } else {
            if (callback) callback();
        }
    }

    public setLoading(loading: boolean): void {
        if (loading) {
            this.loading.show();
        } else {
            this.loading.hide();
        }
    }

    public setUsernameUsed(used: boolean, text ?: string): void {
        if (used) {
            text = text || 'Ocupado';
            text = `<strong style="color: red">${text}</strong>`;
        } else {
            text = text || 'Disponible';
            text = `<strong style="color: green">${text}</strong>`;
            $('#btn-log-in').removeAttr('disabled');
        }

        UIHelper.updatePopover('#username', text);
    }

    private onStageChange(): void {
        if (this.stage == 2) {
            this.username = $('#username');
            const username = this.username;
            username.popover(<PopoverOptions>{
                content: '',
                placement: 'right',
                trigger: 'manual',
                html: true
            });

            $("#log-in-form").submit(() => {
                username.popover('hide');
                this.client.tryLogIn(username.val() as string);
                $('#btn-log-in').attr('disabled', 'disabled');

                return false;
            });
        } else if (this.stage == 3) {
            this.client.loadRoomList();
        } else if (this.stage == 4) {
            this.roomNameInput = $('#room-input-name');
            this.setEditRoomName(false);
            if (this.client.game.creator.id != this.client.player.id) {
                $('#btn-edit-room-name').hide();
            } else {
                this.roomNameInput.popover(<PopoverOptions>{
                    content: '',
                    placement: 'above',
                    trigger: 'manual',
                    html: true
                });

                const ui = this;
                $('#room-name-form').submit(() => {
                    if (!ui.roomNameInput.attr('disabled')) {
                        ui.roomNameInput.popover('hide');
                        ui.client.updateRoomName($('#room-input-name').val().toString());
                        ui.setEditRoomName(false);
                    }
                    return false;
                });
            }

            this.renderStage4Players();
        }
    }

    private enterBtnClick(): void {
        $("body").on('click', '#btn-enter', () => {
            this.setStage(2);
        });
    }

    private usernameTypingStopped(): void {
        const client = this.client;
        const ui = this;
        let timer: Timer = null;
        $('body').on('input', '#username', () => {
            clearTimeout(timer);
            timer = setTimeout(doStuff, 1000);
        });

        function doStuff() {
            const uname = ui.username.val() as string;
            $('#btn-log-in').attr('disabled', 'disabled');
            if (uname.length < 4) {
                UIHelper.updatePopover('#username', '<strong style="color: red">Mínimo 4 carácteres</strong>');
            } else {
                ui.setLoading(true);
                ui.username.popover('hide');
                client.checkUsername(uname);
            }
        }
    }

    private logOutBtnClick(): void {
        $('body').on('click', '#btn-log-out', () => {
            this.client.logOut();
        });
    }

    private newRoomBtnClick(): void {
        $('body').on('click', '#btn-new-room', () => {
            this.setLoading(true);
            this.client.newRoom();
        });
    }

    private editRoomNameBtnClick(): void {
        $('body').on('click', '#btn-edit-room-name', () => {
            this.setEditRoomName(true);
        });
    }

    private roomNameTypingStopped(): void {
        const client = this.client;
        const ui = this;
        let timer: Timer = null;
        $('body').on('input', '#room-input-name', () => {
            $('#btn-save-room-name').attr('disabled', 'disabled');
            clearTimeout(timer);
            timer = setTimeout(doStuff, 1000);
        });

        function doStuff() {
            const name = ui.roomNameInput.val() as string;
            if (name.length < 4) {
                UIHelper.updatePopover('#room-input-name', '<strong style="color: red">Mínimo 4 carácteres</strong>');
            } else if (name.length > 16) {
                UIHelper.updatePopover('#room-input-name', '<strong style="color: red">Máximo 16 carácteres</strong>');
            } else {
                $('#btn-save-room-name').removeAttr('disabled');
                ui.roomNameInput.popover('hide');
            }
        }
    }

    private joinRoomBtnClick(): void {
        const client = this.client;
        $('body').on('click', '.btn-join-room', function() {
            const room = $(this).closest('.room');
            const id = parseInt((<string>room.attr('id')).substr(5));
            client.joinRoom(id);
        });
    }

    private renderStage4Players(): void {
        const playerList = $('#player-list');
        playerList.empty();
        for (const player of this.client.game.players) {
            $(`<div class="d-flex flex-row player">
                <div class="p-2"><img src="img/${player.color.code}_piece.png"/></div>
                <div class="p-2"><p class="card-text">${player.name}</p></div>
            </div>`).appendTo(playerList);
        }
    }

    private setEditRoomName(edit: boolean): void {
        const roomName = $('#room-name');
        const roomInputName = $('#room-input-name');
        const noEditRoomContainer = $('#no-edit-room-container');
        const editRoomContainer = $('#edit-room-container');

        if (edit) {
            roomInputName.val(this.client.game.name);
            noEditRoomContainer.hide();
            editRoomContainer.show();
        } else {
            roomName.text(this.client.game.name);
            noEditRoomContainer.show();
            editRoomContainer.hide();

            if (this.client.game.creator.id != this.client.player.id) {
                $('#btn-edit-room-name').hide();
            }
        }
    }

    public renderRoomList(): void {
        const roomList = $('#room-list');
        roomList.empty();
        for (const game of this.client.newRooms) {
            let playerList = '<div class="d-flex flex-column player-list">';
            for (const player of game.players) {
                playerList += `<div class="d-flex flex-row player">
                    <div class="p-2"><img src="img/${player.color.code}_piece.png"/></div>
                    <div class="p-2"><p class="card-text">${player.name}</p></div>
                </div>`;
            }
            playerList += '</div>';

            $(`<div class="d-inline-flex p-2 align-items-stretch room" id="room-${game.id}">
                <div class="card">
                    <h4 class="card-header">${game.name}</h4>
                    <div class="card-body">
                        ${playerList}
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary btn-join-room"><span class="oi oi-account-login"></span> Unirse</button>
                    </div>
                </div>
            </div>`).appendTo(roomList);
        }
    }

    private static updatePopover(selector: string, content: string, title ?: string, position ?: string) {
        const element = $(selector);

        element.attr('data-content', content);
        if (title) {
            element.attr('data-title', title);
        }

        element.popover('show');
        const popover = element.data('bs.popover');
        popover.setContent();
        $(popover.tip).addClass(popover.config.placement);

        if (position) {
            element.attr('data-placement', position);
            element.popover('update');
        }
    }
}