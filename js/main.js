var myApp = angular.module('myApp', ['ngSanitize', 'ngCookies', 'ngAnimate']);
myApp.controller('app_Ctrl', async function ($scope, $http, $scope, $cookies, $window) {

    $scope.loggedin = false;
    $scope.username = 'Please Login';
    $scope.currentDistrict = { id: 0, name: 'All Post' };

    //get all users
    $scope.users = {};
    await $http({
        method: 'GET',
        url: 'http://district-buddy.herokuapp.com/get/users'
    })
        .then(function (res) {
            if (res.data) {
                res.data.forEach(element => {
                    $scope.users[element.id] = { name: element.name, img: element.img };
                });
            } else {
                console.log(res);
            }
        });

    if ($cookies.get('token')) {
        $scope.loggedin = true;
        $scope.username = $scope.users[$cookies.get('id')].name;
    }

    //get all posts and comments
    $scope.posts = {};
    await $http.get('http://district-buddy.herokuapp.com/get/posts')
        .then(function (res) {
            if (res.data) {
                res.data.forEach(element => {
                    var date = new Date(element.timestamp);
                    $scope.posts[element.id] = { id: element.id, poster_id: element.poster_id, poster_name: $scope.users[element.poster_id].name, timestamp: date.toLocaleString('en-us'), content: element.content };
                })
            } else {
                console.log(res);
            }
        });

    //get all areas and district
    $scope.areas = {};
    await $http.get('http://district-buddy.herokuapp.com/get/areas')
        .then(function (res) {
            if (res.data) {
                res.data.forEach(element => {
                    $scope.areas[element.id] = { name: element.name_en, districts: [] };
                })
            } else {
                console.log(res);
            }
        });
    $scope.districts = {};
    $scope.districts[0] = { name: 'All Post' };
    await $http.get('http://district-buddy.herokuapp.com/get/districts')
        .then(function (res) {
            if (res.data) {
                res.data.forEach(element => {
                    $scope.areas[element.area_id].districts.push({ id: element.id, name: element.name_en });
                    $scope.districts[element.id] = { name: element.name_en, area_id: element.area_id };
                });
            } else {
                console.log(res);
            }
        });

    $scope.selectDistrict = async function (id) {
        var posts = {};
        var url;
        if (id == 0) {
            url = 'http://district-buddy.herokuapp.com/get/posts';
        } else {
            url = 'http://district-buddy.herokuapp.com/district/' + id + '/posts';
        }
        await $http.get(url)
            .then(function (res) {
                if (res.data) {
                    res.data.forEach(element => {
                        var date = new Date(element.timestamp);
                        posts[element.id] = { id: element.id, poster_id: element.poster_id, poster_name: $scope.users[element.poster_id].name, timestamp: date.toLocaleString('en-us'), content: element.content };
                    })
                } else {
                    console.log(res);
                }
            });
        $scope.$apply(function () {
            $scope.posts = posts;
            $scope.currentDistrict = { id: id, name: $scope.districts[id].name };
        })
    }

    $scope.selectPost = async function (id) {
        if (id == 0) {
            $scope.comments = {};
            $scope.currentPost = {};
        } else {
            var comments = {};
            await $http.get('http://district-buddy.herokuapp.com/post/' + id + '/comments')
                .then(function (res) {
                    if (res.data) {
                        res.data.forEach(element => {
                            var date = new Date(element.timestamp);
                            comments[element.id] = { id: element.id, poster_id: element.poster_id, poster_name: $scope.users[element.poster_id].name, timestamp: date.toLocaleString('en-us'), content: element.content };
                        })
                    } else {
                        console.log(res);
                    }
                });
            $scope.$apply(function () {
                $scope.comments = comments;
                $scope.currentPost = { id: id, poster_name: $scope.posts[id].poster_name, poster_id: $scope.posts[id].poster_id, timestamp: $scope.posts[id].timestamp, content: $scope.posts[id].content };
            })
        }
    }

    $scope.login = function (phone, pwd) {
        if (phone && pwd) {
            $http.post('http://district-buddy.herokuapp.com/login', $.param({ phone: phone, pwd: pwd }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
                .then(
                    function success(res) {
                        $cookies.put('id', res.data.id);
                        $cookies.put('token', res.data.token);
                        $window.alert('Login success!');
                        location.reload();
                    },
                    function error(res) {
                        if (res.status == 404) {
                            $window.alert('Incorrect phone number or password!');
                        } else if (res.status == 500) {
                            $window.alert('Please try again later!');
                        }
                    }
                )
        } else {
            $window.alert('Please enter phone number and password!');
        }
    }

    $scope.logout = function () {
        $cookies.remove('token');
        location.reload();
    }

    $scope.register = async function (name, phone, pwd1, pwd2) {
        var str = "";
        if (!name) {
            str += 'Please enter your username!\n';
        } else if (name.length > 32) {
            str += 'Username is too long!(5-32)\n';
        } else if (name.length < 5) {
            str += 'Username is too short!(5-32)\n';
        }
        if (!phone) {
            str += 'Please enter your Hong Kong phone number!\n';
        } else if (isNaN(phone) || phone.length != 8) {
            str += 'Invalid Hong Kong phone number!\n';
        }
        if (!pwd1) {
            str += 'Please enter your password!\n';
        } else if (pwd1.length > 64) {
            str += 'Password is too long!(8-64)\n';
        } else if (pwd1.length < 8) {
            str += 'Password is too short!(8-64)\n';
        }
        if (!pwd2) {
            str += 'Please enter your password again to confirm!\n';
        } else if (pwd2 != pwd1) {
            str += 'Password confirmation doesn\'t match!\n';
        }
        if (str == "") {
            await $http.post('http://district-buddy.herokuapp.com/reg', $.param({ name: name, phone: phone, pwd: pwd1 }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
                .then(
                    function success(res) {
                        str = "Registration complete! You can now login."
                        $scope.registering = false;
                    },
                    function error(res) {
                        if (res.status == 409) {
                            $window.alert('This phone number already registered!');
                        } else if (res.status == 500) {
                            $window.alert('Please try again later!');
                        }
                    }
                )
        }
        $window.alert(str);
    }

    $scope.newPostBtn = function () {
        if ($cookies.get('token')) {
            if ($scope.currentDistrict.id != 0) {
                $scope.newContent = $scope.newPost = true;
            } else {
                $window.alert('Please select a district first!');
            }
        } else {
            $window.alert('Please login first!');
            $scope.showLogin = true;
        }
    }

    $scope.newCommentBtn = function () {
        if ($cookies.get('token')) {
            if ($scope.currentPost) {
                $scope.newContent = $scope.newComment = true;
            } else {
                $window.alert('Please select a post first!');
            }
        } else {
            $window.alert('Please login first!');
            $scope.showLogin = true;
        }
    }

    $scope.submit = function (content) {
        if (!content) {
            $window.alert('Please enter your content!\n');
        } else if (content.length > 1024) {
            $window.alert('Content is too long!(3-1024)\n');
        } else if (content.length < 3) {
            $window.alert('Content is too short!(3-1024)\n');
        } else {
            var token = $cookies.get('token');
            var url = 'http://district-buddy.herokuapp.com/new';
            var data = { token: token, content: content };
            if ($scope.newPost) {
                url += 'post';
                data['district_id'] = $scope.currentDistrict.id;
            } else {
                url += 'comment';
                data['post_id'] = $scope.currentPost.id;
            }
            $http.post(url, $.param(data), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
                .then(
                    function success(res) {
                        if ($scope.newPost) {
                            $window.alert('Post created!');
                            $scope.selectDistrict($scope.currentDistrict.id);
                        } else {
                            $window.alert('Comment created!');
                            $scope.selectPost($scope.currentPost.id);
                        }
                        $scope.newContent = $scope.newPost = $scope.newComment = false;
                    },
                    function error(res) {
                        if (res.status == 401) {
                            $window.alert('Authorization failed! Please login again!');
                            $cookies.remove('token');
                            location.reload();
                        } else if (res.status == 500) {
                            $window.alert('Please try again later!');
                        }
                    }
                )
        }
    }

    $scope.editContent = function (type, id) {
        if ((type == 'post' && $scope.posts[id].poster_id == $cookies.get('id')) || (type == 'comment' && $scope.comments[id].poster_id == $cookies.get('id'))) {
            if (type == 'post') {
                $scope.newContent = true;
                $scope.editPost = id;
            } else {
                $scope.newContent = true;
                $scope.editComment = id;
            }
        } else {
            $window.alert('You can\'t edit this ' + type + ' because you are not the poster!');
        }
    }

    $scope.delContent = function (type, id) {
        if ((type == 'post' && $scope.posts[id].poster_id == $cookies.get('id')) || (type == 'comment' && $scope.comments[id].poster_id == $cookies.get('id'))) {
            if (confirm('Are you sure to delete this ' + type + '?')) {
                var token = $cookies.get('token');
                var data = { token: token };
                if (type == 'post') {
                    data['post_id'] = id;
                } else {
                    data['comment_id'] = id;
                }
                $http({
                    method: 'DELETE',
                    url: 'http://district-buddy.herokuapp.com/del' + type,
                    data: $.param(data),
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                })
                    .then(
                        function success(res) {
                            $window.alert("Delete complete!");
                            if (type == 'post') {
                                $scope.selectDistrict($scope.currentDistrict.id);
                                $scope.selectPost(0);
                            } else {
                                $scope.selectPost($scope.currentPost.id);
                            }
                        },
                        function error(res) {
                            if (res.status == 401) {
                                $window.alert('Authorization failed! Please try again!');
                            } else if (res.status == 500) {
                                $window.alert('Please try again later!');
                            }
                        }
                    )
            }
        } else {
            $window.alert('You can\'t delete this ' + type + ' because you are not the poster!');
        }
    }
});