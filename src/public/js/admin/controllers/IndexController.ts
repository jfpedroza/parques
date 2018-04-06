
declare const angular: ng.IAngularStatic;
import SocketService = require("../services/SocketService");
import BaseController = require("./BaseController");
import {Game} from "../../../../models/Game";
import {Player} from "../../../../models/Player";

interface IndexScope extends ng.IScope {
}

class IndexController extends BaseController {
    static $inject = ['$scope', 'SocketService'];

    games: Game[];

    players: Player[];

    constructor($scope: IndexScope, socketService: SocketService) {
        super();
        this.games = [];
        this.players = [];

        $scope.$on('socket:game-list', (ev, games: Game[]) => {
            games.forEach(game => game.created = new Date(game.created));
            this.games = games;
        });

        $scope.$on('socket:player-list', (ev, players: Player[]) => {
            this.players = players;
        });

        $scope.$on('socket:add-game', (ev, game: Game) => {
            game.created = new Date(game.created);
            this.games.push(game);
        });

        $scope.$on('socket:update-game', (ev, game: Game) => {
            const index = this.games.findIndex(g => g.id == game.id);
            if (index >= 0) {
                game.created = new Date(game.created);
                this.games[index] = game;
            } else {
                console.log(`[Update Game] Game not found. ID: ${game.id}`);
            }
        });

        $scope.$on('socket:delete-game', (ev, game: Game) => {
            const index = this.games.findIndex(g => g.id == game.id);
            if (index >= 0) {
                this.games.splice(index, 1);
            } else {
                console.log(`[Delete Game] Game not found. ID: ${game.id}`);
            }
        });

        $scope.$on('socket:add-player', (ev, player: Player) => {
            this.players.push(player);
        });

        $scope.$on('socket:update-player', (ev, player: Player) => {
            const index = this.players.findIndex(p => p.id == player.id);
            if (index >= 0) {
                this.players[index] = player;
            } else {
                console.log(`[Update Player] Player not found. ID: ${player.id}`);
            }
        });

        $scope.$on('socket:delete-player', (ev, player: Player) => {
            const index = this.players.findIndex(p => p.id == player.id);
            if (index >= 0) {
                this.players.splice(index, 1);
            } else {
                console.log(`[Delete Player] Player not found. ID: ${player.id}`);
            }
        });

        socketService.emit('register-admin');
    }
}

angular.module('ParquesAdmin').controller('IndexController', IndexController);

export = IndexController;