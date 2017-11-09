
import {Client} from "./Client";
import Timer = NodeJS.Timer;

export class UIHelper {

    private client: Client;

    private stage: number = 0;

    private content: JQuery;

    public constructor(client: Client) {
        this.client = client;
        this.content = $("#content");
    }

    public configureEvents() {
        this.enterBtnClick();
        this.usernameTypingStopped();
    }

    public setStage(s: number) {
        this.stage = s;
        if (s == 0) {
            this.content.html('');
        } else {
            this.content.load(`stages/stage${this.stage}.html`, () => {
                console.log(`Stage ${this.stage} loaded`);
                this.onStageChange();
            });
        }
    }

    public setUsernameUsed(used: boolean) {
        let text;
        if (used) {
            text = '<strong style="color: red">Ocupado</strong>';
        } else {
            text = '<strong style="color: green">Disponible</strong>';
        }

        UIHelper.updatePopover('#username', text);
    }

    private onStageChange() {
        if (this.stage == 2) {
            $("#username").popover(<PopoverOptions>{
                content: '...',
                placement: 'right',
                trigger: 'manual',
                html: true
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
        let timer: Timer = null;
        $("body").on('input', '#username', () => {
            clearTimeout(timer);
            timer = setTimeout(doStuff, 1000);
        });

        function doStuff() {
            UIHelper.updatePopover('#username', '...');
            client.checkUsername($('#username').val() as string);
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