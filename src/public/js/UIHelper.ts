
import {Client} from "./Client";
import Timer = NodeJS.Timer;

export class UIHelper {

    private client: Client;

    private stage: number = 0;

    private content: JQuery;

    private loading: JQuery;

    private username: JQuery;

    public constructor(client: Client) {
        this.client = client;
        this.content = $("#content");
        this.loading = $("#loading");
    }

    public configureEvents() {
        this.enterBtnClick();
        this.usernameTypingStopped();
        this.logOutBtnClick();
    }

    public setStage(stage: number, callback?: Function) {
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

    public setLoading(loading: boolean) {
        if (loading) {
            this.loading.show();
        } else {
            this.loading.hide();
        }
    }

    public setUsernameUsed(used: boolean, text ?: string) {
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

    private onStageChange() {
        if (this.stage == 2) {
            this.username = $("#username");
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
        }
    }

    private enterBtnClick() {
        const ui = this;
        $("body").on('click', '#btn-enter', () => {
            ui.setStage(2);
        });
    }

    private usernameTypingStopped() {
        const client = this.client;
        const ui = this;
        let timer: Timer = null;
        $("body").on('input', '#username', () => {
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

    private logOutBtnClick() {
        const client = this.client;
        $("body").on('click', '#btn-log-out', () => {
            client.logOut();
        });
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