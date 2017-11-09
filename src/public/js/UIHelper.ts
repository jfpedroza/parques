
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

    private onStageChange() {
        if (this.stage == 2) {
            $("#username").popover(<PopoverOptions>{
                content: '...',
                placement: 'right',
                trigger: 'manual'
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
        let timer: Timer = null;
        $("body").on('input', '#username', () => {
            clearTimeout(timer);
            timer = setTimeout(doStuff, 1000);
        });

        function doStuff() {
            UIHelper.updatePopover('#username', "holi :3 " + Math.random());
        }
    }

    private static updatePopover(selector: string, content: string, title ?: string, position ?: string) {
        const element = $(selector);

        element.attr('data-content', content);
        if (title) {
            element.attr('data-title', title);
        }

        element.popover('show');
        const popover = element.data('popover');
        popover.setContent();
        popover.$tip.addClass(popover.options.placement);

        if (position) {
            element.attr('data-placement', position);
            element.popover('update');
        }
    }
}