
declare const angular: any;
import SocketService = require("../services/SocketService");

interface IndexScope extends ng.IScope {
    testValue: number;
}

class IndexController {
    static $inject = ['$scope', 'SocketService'];

    constructor($scope: IndexScope, socketService: SocketService) {
        $scope.testValue = 0;

        $scope.$on('socket:test', (ev, value) => {
            $scope.testValue = value;
            console.log(`Holi :${value}`);
        });

        socketService.emit('test');
    }
}

angular.module('ParquesAdmin').controller('IndexController', IndexController);

export = IndexController;