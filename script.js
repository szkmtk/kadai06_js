let map;
let service;
let infowindow;
let userMarker;

// 「カフェを探す」ボタンがクリックされたときの処理
document.getElementById('findCafes').addEventListener('click', function() {
    this.disabled = true; // ボタンを非アクティブにする
    document.getElementById('loading').style.display = 'block'; // ローディング表示を有効にする

    // Google Maps APIが正しくロードされているか確認
    if (typeof google === 'object' && typeof google.maps === 'object') {
        initMap(); // マップの初期化
    } else {
        alert('Google Maps APIのロードを待っています。もう一度試してください。'); // APIのロード待ちメッセージ
        resetLoadingState(); // ローディング状態のリセット
    }
});

// マップの初期化とカフェ検索の処理
function initMap() {
    // ジオロケーションが利用可能かチェック
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map = new google.maps.Map(document.getElementById('map'), {
                center: userLocation,
                zoom: 15
            });

            // ユーザーの現在地にマーカーを設置
            userMarker = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: "Your Location",
                icon: {
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    scaledSize: new google.maps.Size(40, 40)
                }
            });

            // 検索リクエストの設定
            const request = {
                location: userLocation,
                radius: '500',
                keyword: '電源のあるカフェ',
                type: ['cafe']
            };

            infowindow = new google.maps.InfoWindow();
            service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, callback); // 周辺のカフェを検索
        }, () => {
            handleLocationError(true, infowindow, map.getCenter()); // 位置情報取得エラーの処理
            resetLoadingState();
        });
    } else {
        handleLocationError(false, infowindow, map.getCenter()); // ジオロケーション非対応エラーの処理
        resetLoadingState();
    }
}

// 検索結果のコールバック関数
function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        results.forEach(createMarker); // 結果ごとにマーカーを作成
    }
    resetLoadingState();
}

// マーカー作成関数
function createMarker(place) {
    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new google.maps.Size(40, 40)
        }
    });

    // マーカーをクリックしたときの処理
    google.maps.event.addListener(marker, 'click', () => {
        const request = {
            placeId: place.place_id,
            fields: ['name', 'formatted_address', 'photos', 'rating', 'reviews', 'opening_hours']
        };

        // 詳細情報の取得と表示
        service.getDetails(request, (details, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                const content = `
                    <div>
                        <h3>${details.name}</h3>
                        <p>${details.formatted_address}</p>
                        ${details.photos ? `<img src="${details.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 })}" alt="${details.name}">` : ''}
                        <p>評価: ${getStarRating(details.rating)}</p>
                        <p>営業時間: ${details.opening_hours.weekday_text.join('<br>')}</p>
                        <h4>口コミ:</h4>
                        <ul>
                            ${details.reviews.slice(0, 3).map(review => `<li>${review.text}</li>`).join('')}
                        </ul>
                    </div>
                `;
                infowindow.setContent(content); // 情報ウィンドウに内容を設定
                infowindow.open(map, marker); // 情報ウィンドウを開く
            }
        });
    });
}

// 星評価をHTMLで表現する関数
function getStarRating(rating) {
    const fullStar = '&#9733;'; // 全星
    const halfStar = '&#9734;'; // 半星
    const emptyStar = '&#9734;'; // 空星
    let starRating = '';

    // 評価に応じて星を表示
    for (let i = 0; i < 5; i++) {
        if (rating >= i + 0.8) {
            starRating += fullStar;
        } else if (rating >= i + 0.3) {
            starRating += halfStar;
        } else {
            starRating += emptyStar;
        }
    }
    return starRating;
}

// 位置情報エラーを処理する関数
function handleLocationError(browserHasGeolocation, infowindow, pos) {
    infowindow.setPosition(pos); // 位置情報エラー時にウィンドウを表示
    infowindow.setContent(browserHasGeolocation ? 'Error: The Geolocation service failed.' : 'Error: Your browser doesn\'t support geolocation.');
    infowindow.open(map);
}

// ローディング状態をリセットする関数
function resetLoadingState() {
    document.getElementById('findCafes').disabled = false; // ボタンを再びアクティブにする
    document.getElementById('loading').style.display = 'none'; // ローディング表示を非表示にする
}
