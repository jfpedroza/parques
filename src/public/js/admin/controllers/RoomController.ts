
import SocketService = require("../services/SocketService");
import BaseController = require("./BaseController");
import {Game} from "../../../../models/Game";

declare const angular: ng.IAngularStatic;

class RoomController extends BaseController {
    static $inject = ['$scope', '$routeParams', 'SocketService', '$location'];

    room: Game;
    splitterSettings: any;

    constructor($scope: ng.IScope, $routeParams: any, socketService: SocketService, $location: ng.ILocationService) {
        super();

        const roomId: number = $routeParams.roomId;
        console.log(`Entered room [${roomId}]: Loading...`);
        this.splitterSettings = { width: '100%', height: '99vh', orientation: 'vertical', panels: [{ size: '50%', min: 100 }, { size: '50%', min: 100 }] };

        $scope.$on('socket:update-game', (ev, game: Game) => {
            if (game) {
                if (roomId == game.id) {
                    game.created = new Date(game.created);
                    if (!this.room) {
                        console.log(`Room game loaded.`);
                    }

                    this.room = game;
                }
            } else {
                console.log(`Room not found... Redirecting to home.`);
                $location.path('/');
            }
        });

        $scope.$on('socket:delete-game', (ev, game: Game) => {
            if (roomId == game.id) {
                $location.path('/');
            }
        });

        socketService.emit('register-admin');
        socketService.emit('get-game', roomId);
    }
}

angular.module('ParquesAdmin').controller('RoomController', RoomController);

export = RoomController;