
import {Client} from "./Client";

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
    }

    private enterBtnClick() {
        let _this = this;
        $("body").on('click', '#btn-enter', () => {
            _this.setStage(2);
        });
    }

    public setStage(s: number) {
        this.stage = s;
        if (s == 0) {
            this.content.html('');
        } else {
            this.content.load(`stages/stage${this.stage}.html`, () => {
                console.log(`Stage ${this.stage} loaded`);
            });
        }
    }
}