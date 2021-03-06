var homeController = angular.module('homeController', []);

var Types = {
    story: "story",
    user: "user",
    vote: "vote",
    card: "card"
};

var Events = {
    vote_added: "VOTE_ADDED",
    vote_removed: "VOTE_REMOVED",
    story_added: "STORY_ADDED",
    story_removed: "STORY_REMOVED",
    story_ended: "STORY_ENDED",
    user_connected: "USER_CONNECTED",
    user_disconnected: "USER_DISCONNECTED"
};

homeController.controller('homeCtrl',
    ['$http', '$log', '$scope', '$sessionStorage', '$location', 'webSocketFactory', 'storyFactory', 'voteFactory',
        'userFactory', 'session', 'users', 'stories',
        function ($http, $log, $scope, $sessionStorage, $location, webSocketFactory, storyFactory, voteFactory,
                  userFactory, session, users, stories) {

            $scope.logout = function () {
                $sessionStorage.$reset();
                userFactory.disconnect($scope.currentUser, function (response) {
                    if (response.status === 'OK') {
                        webSocketFactory.disconnect();
                        $location.path('/login');
                    }
                });
            };

            $scope.getIndex = function (type, item) {
                if (type === Types.story) {
                    for (var i = 0, len = $scope.stories.length; i < len; i++) {
                        if ($scope.stories[i].storyId === item.storyId) {
                            return i;
                        }
                    }
                    return -1;
                }

                if (type === Types.vote) {
                    for (var i = 0, len = $scope.votes.length; i < len; i++) {
                        if ($scope.votes[i].voteId === item.voteId) {
                            return i;
                        }
                    }
                    return -1;
                }

                if (type === Types.user) {
                    for (var i = 0, len = $scope.users.length; i < len; i++) {
                        if ($scope.users[i].username === item.username) {
                            return i;
                        }
                    }
                    return -1;
                }

                if (type === Types.card) {
                    for (var i = 0, len = $scope.cards.length; i < len; i++) {
                        if ($scope.cards[i].id === item.id) {
                            return i;
                        }
                    }
                    return -1;
                }
            };

            $scope.setCurrentStory = function (story) {
                $scope.currentStory = story;
                //reset votes
                animateCard($scope.selectedCard);
                //get votes from backend
                getVotes();
            };

            $scope.removeStory = function (story) {
                $scope.stories.splice($scope.getIndex(Types.story, story), 1);
                storyFactory.remove(story.storyId, function (data) {
                    if (data.status === 'KO') {
                        $scope.stories.push(story);
                    }
                });
            };

            $scope.addStory = function () {
                if (!$scope.newStory.storyName) {
                    return;
                }
                $scope.newStory.sessionId = $scope.sessionId;
                $scope.newStory.order = $scope.stories.length + 1;
                storyFactory.create($scope.newStory, function (data) {
                    $scope.newStory = {};
                });
            };

            $scope.createVote = function (card) {
                $scope.loading = true;
                var data = {
                    sessionId: $scope.sessionId,
                    storyId: $scope.currentStory.storyId,
                    username: $scope.currentUser.username,
                    value: card.id
                };

                if ($scope.currentVote) {
                    data.voteId = $scope.currentVote.voteId;
                }

                var index = $scope.getIndex(Types.vote, data);
                if (index >= 0) {
                    $scope.votes[index] = data;
                }

                $scope.currentVote = data;
                animateCard(card);
                highlightVotes();

                voteFactory.create(data, function (response) {
                    $scope.loading = false;
                    var index = $scope.getIndex(Types.vote, response);
                    if (index < 0) {
                        $scope.votes[index] = response;
                    }
                    $scope.currentVote = response;
                });
            };

            $scope.removeVote = function (card) {
                $scope.loading = true;
                voteFactory.remove($scope.currentVote.voteId, function (response) {
                    $scope.loading = false;
                    if (response.status === 'OK') {
                        $scope.votes.splice($scope.getIndex(Types.vote, $scope.currentVote), 1);
                        $scope.currentVote = {};
                        animateCard(card);
                        highlightVotes();
                    }
                });
            };


            $scope.selectCard = function (card) {
                if ($scope.currentStory.ended || $scope.loading)
                    return;
                if (!card.selected) {
                    $scope.createVote(card);
                } else {
                    $scope.removeVote(card);
                }
            };

            $scope.endVote = function () {
                if (!$scope.currentStory.ended)
                    return;
                storyFactory.endStory($scope.currentStory.storyId, function (response) {
                    if (response.status === 'OK') {
                        $scope.getStats();
                    } else {
                        $scope.currentStory.ended = false;

                    }
                });
            };

            $scope.getCard = function (id) {
                var selectCard;
                for (var i = 0, len = $scope.cards.length; i < len; i++) {
                    if ($scope.cards[i].id == id) {
                        selectCard = $scope.cards[i];
                        break;
                    }
                }

                return selectCard;
            };

            $scope.getColor = function (vote) {
                if (!vote) {
                    return {};
                }
                var field = $scope.getCard(vote).color,
                    color = {};
                color[field] = $scope.currentStory.ended;
                return color;
            };

            $scope.getStats = function () {
                $scope.min = '-';
                $scope.max = '-';
                if ($scope.currentStory.ended) {
                    var min = angular.undefined, max = angular.undefined, current;
                    angular.forEach($scope.votes, function (vote) {
                        current = $scope.getIndex(Types.card, {id: vote.value});
                        if (!max || current > max) {
                            max = current;
                        }
                        if (!min || current < min) {
                            min = current
                        }
                    });

                    var unit;
                    if (min) {
                        unit = $scope.cards[min].unit;
                        $scope.min = $scope.cards[min].value;
                        if (unit) {
                            $scope.min += " " + unit;
                        }
                    }


                    if (max) {
                        unit = $scope.cards[max].unit;
                        $scope.max = $scope.cards[max].value;
                        if (unit) {
                            $scope.max += " " + unit;
                        }
                    }
                }
            };

            $scope.consumeEvent = function (item) {
                $log.info(item);
                var index;
                if (item.type === Events.story_added) {
                    index = $scope.getIndex(Types.story, item.data);
                    if (index < 0) {
                        $scope.stories.push(item.data);
                    }

                } else if (item.type === Events.story_removed) {
                    index = $scope.getIndex(Types.story, {storyId: item.data});
                    if (index >= 0) {
                        $scope.stories.splice(index, 1);
                    }

                } else if (item.type === Events.story_ended) {
                    index = $scope.getIndex(Types.story, {storyId: item.data});
                    if (index >= 0) {
                        $scope.stories[index].ended = true;
                        $scope.getStats();
                    }

                } else if (item.type === Events.vote_added) {
                    index = $scope.getIndex(Types.vote, item.data);
                    if (index < 0) {
                        $scope.votes.push(item.data);
                    } else {
                        $scope.votes[index] = item.data;
                    }
                    // add vote to user
                    var userIndex = $scope.getIndex(Types.user, {username: item.data.username});
                    $scope.users[userIndex].vote = item.data.value;
                    $scope.users[userIndex].hasVoted = true;

                } else if (item.type === Events.vote_removed) {
                    index = $scope.getIndex(Types.vote, {voteId: item.data});
                    if (index >= 0) {
                        var username = $scope.votes[index].username;
                        if (username !== $scope.currentUser.username) {
                            var userIndex = $scope.getIndex(Types.user, {username: username});
                            $scope.users[userIndex].vote = {};
                            $scope.users[userIndex].hasVoted = false;
                            $scope.votes.splice(index, 1);
                        }
                    }

                } else if (item.type === Events.user_connected) {
                    index = $scope.getIndex(Types.user, item.data);
                    if (index < 0) {
                        $scope.users.push(item.data);
                    }

                } else if (item.type === Events.user_disconnected) {
                    index = $scope.getIndex(Types.user, {username: item.data});
                    if (index >= 0) {
                        $scope.users.splice(index, 1);
                    }
                }
                $scope.$apply();
            };

            function getVotes() {
                if (!$scope.currentStory)
                    return;

                //get saved votes
                voteFactory.get($scope.currentStory.storyId, function (data) {
                    $scope.votes = data;
                    $scope.currentVote = angular.undefined;

                    for (var i = 0, len = $scope.votes.length; i < len; i++) {
                        if ($scope.votes[i].username == $scope.currentUser.username) {
                            $scope.currentVote = $scope.votes[i];
                            break;
                        }
                    }

                    // show current users selected card
                    highlightCard();
                    // show users votes
                    highlightVotes();
                    // get stats
                    $scope.getStats();
                })
            }

            function init() {
                if (!$sessionStorage.username || !$sessionStorage.sessionId) {
                    $location.path('/login');
                }
                //initialize clipboard (copy to keyboard feature)
                new Clipboard('.clipboard');

                $scope.showEndedStories = false;

                $scope.info = {
                    selected: 'stories'
                };

                $scope.votes = [];

                $scope.currentStory = {};
                $scope.newStory = {};

                $scope.currentVote = {};

                $scope.username = $sessionStorage.username;
                $scope.sessionId = $sessionStorage.sessionId;

                //subscribe
                webSocketFactory.subscribe($scope.sessionId, function (data) {
                    $scope.consumeEvent(data);
                });

                //get users
                $scope.users = users;
                //get current user
                angular.forEach($scope.users, function (user) {
                    if (user.username == $scope.username) {
                        $scope.currentUser = user;
                    }
                });

                //get session info
                $scope.sprintName = session.sprintName;
                if (session.cardSet == 'time') {
                    $scope.cards = cards.time;
                } else if (session.cardSet == 'fibonacci') {
                    $scope.cards = cards.fibonacci;
                } else {
                    $scope.cards = cards.modifiedFibonacci;
                }

                //get stories
                $scope.stories = stories;
                // set current story
                $scope.setCurrentStory($scope.stories[0]);
            }

            function animateCard(card) {
                if (!card)
                    return;
                if (!card.selected) {
                    if ($scope.selectedCard) {
                        $scope.selectedCard.selected = false;
                        $scope.selectedCard.animate = 'move-down';
                    }
                    $scope.selectedCard = card;
                    card.selected = true;
                    card.animate = 'move-up';
                } else {
                    card.selected = false;
                    card.animate = 'move-down';
                    $scope.selectedCard = angular.undefined;
                }
            }

            function highlightVotes() {
                var vote;
                angular.forEach($scope.users, function (user) {
                    user.hasVoted = false;
                    user.vote = angular.undefined;
                    for (var i = 0, len = $scope.votes.length; i < len; i++) {
                        vote = $scope.votes[i];
                        if (vote.username == user.username) {
                            user.hasVoted = true;
                            user.vote = vote.value;
                            break;
                        }
                    }

                });
            }

            function highlightCard() {
                for (var i = 0, len = $scope.votes.length; i < len; i++) {
                    if ($scope.votes[i].username == $scope.currentUser.username) {
                        var card = $scope.getCard($scope.votes[i].value);
                        animateCard(card);
                        break;
                    }
                }
            }

            init();
        }

    ])
;

homeController.resolve = {
    session: ['sessionFactory', '$sessionStorage', '$q', function (sessionFactory, $sessionStorage, $q) {
        var delay = $q.defer();
        sessionFactory.get($sessionStorage.sessionId, function (data) {
            delay.resolve(data);
        });
        return delay.promise;
    }],
    users: ['userFactory', '$sessionStorage', '$q', function (userFactory, $sessionStorage, $q) {
        var delay = $q.defer();
        userFactory.get($sessionStorage.sessionId, function (data) {
            delay.resolve(data);
        });
        return delay.promise;
    }],
    stories: ['storyFactory', '$sessionStorage', '$q', function (storyFactory, $sessionStorage, $q) {
        var delay = $q.defer();
        storyFactory.get($sessionStorage.sessionId, function (data) {
            delay.resolve(data);
        });
        return delay.promise;
    }]
};