
import {Game, GameStatus} from "../../../../models/Game";
import {Player, PlayerStatus} from "../../../../models/Player";

class BaseController {

    getPlayerStatusText(player: Player): string {
        switch (player.status) {
            case PlayerStatus.CONNECTED:
                return "Online";
            case PlayerStatus.DISCONNECTED:
                return "Offline";
        }

        return "Invalid";
    }

    getPlayerStatusBadgeColor(player: Player): string {
        switch (player.status) {
            case PlayerStatus.CONNECTED:
                return "success";
            case PlayerStatus.DISCONNECTED:
                return "dark";
        }

        return "danger";
    }

    getGameStatusColor(game: Game): string {
        switch (game.status) {
            case GameStatus.CREATED:
                return "success";
            case GameStatus.ONGOING:
                return "primary";
            case GameStatus.FINISHED:
                return "info";
        }

        return "danger";
    }

    getGameStatusText(game: Game): string {
        return GameStatus[game.status];
    }
}

export = BaseController;