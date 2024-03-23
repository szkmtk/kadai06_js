let map;
let service;
let infowindow;
let userMarker;

// 'findCafes'ボタンをクリックしたときのイベントリスナー
document.getElementById('findCafes').addEventListener('click', function() {
    this.disabled = true; // ボタンを無効にする
    document.getElementById('loading').style.display = 'block'; // ローディングアイコンを表示

    // Google Maps APIが利用可能かチェック
    if (typeof google === 'object' && typeof google.maps === 'object') {
        initMap(); // マップ初期化関数を呼び出し
    } else {
        alert('Google Maps APIのロードを待っています。もう一度試してください。');
        resetLoadingState(); // ローディング状態をリセット
    }
});

// マップを初期化する関数
function initMap() {
    if (navigator.geolocation) {
        // ユーザーの現在位置を取得
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                // マップをユーザーの現在位置にセット
                map = new google.maps.Map(document.getElementById('map'), {
                    center: userLocation,
                    zoom: 15
                });
                setupClickListener(); // クリックリスナーのセットアップ
            },
            () => {
                // 位置情報取得に失敗した場合、デフォルト位置（東京）でマップを表示
                map = new google.maps.Map(document.getElementById('map'), {
                    center: {lat: 35.6895, lng: 139.6917},
                    zoom: 15
                });
                setupClickListener(); // クリックリスナーのセットアップ
            }
        );
    } else {
        // 位置情報が利用不可の場合、デフォルト位置（東京）でマップを表示
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 35.6895, lng: 139.6917},
            zoom: 15
        });
        setupClickListener(); // クリックリスナーのセットアップ
    }
}

// マップ上でのクリックイベントリスナーを設定する関数
function setupClickListener() {
    map.addListener('click', function(event) {
        const clickedLocation = event.latLng;

        // 以前のユーザーマーカーがあれば削除
        if (userMarker) {
            userMarker.setMap(null);
        }

        // クリックされた位置に新しいマーカーを設置
        userMarker = new google.maps.Marker({
            position: clickedLocation,
            map: map,
            title: "Clicked Location",
            icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                scaledSize: new google.maps.Size(40, 40)
            }
        });

        // カフェ検索のリクエストパラメータ設定
        const request = {
            location: clickedLocation,
            radius: '500',
            keyword: '電源のあるカフェ',
            type: ['cafe']
        };

        infowindow = new google.maps.InfoWindow();
        service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, callback); // 周辺のカフェを検索
    });
    
    resetLoadingState(); // ローディング状態をリセット
}

// 検索結果を処理するコールバック関数
function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        results.forEach(createMarker); // 各結果に対してマーカーを作成
    }
}

// マーカーを作成する関数
function createMarker(place) {
    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png", // 赤いマーカーを使用
            scaledSize: new google.maps.Size(40, 40) // マーカーのサイズ設定
        }
    });

    // マーカーをクリックしたときのイベントリスナー
    google.maps.event.addListener(marker, 'click', () => {
        const request = {
            placeId: place.place_id, // 詳細を取得する場所のID
            fields: ['name', 'formatted_address', 'photos', 'rating', 'reviews', 'opening_hours'] // 取得する情報のフィールド
        };

        // 詳細情報の取得と表示
        service.getDetails(request, (details, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                const content = `
                    <div>
                        <h3>${details.name}</h3> <!-- 店名 -->
                        <p>${details.formatted_address}</p> <!-- 住所 -->
                        ${
                            details.photos 
                            ? `<img src="${details.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 })}" alt="${details.name}">` // 写真
                            : ''
                        }
                        <p>評価: ${getStarRating(details.rating)}</p> <!-- 評価 -->
                        <p>営業時間: ${details.opening_hours.weekday_text.join('<br>')}</p> <!-- 営業時間 -->
                        <h4>口コミ:</h4>
                        <ul>
                            ${details.reviews.slice(0, 3).map(review => `<li>${review.text}</li>`).join('')} <!-- 口コミ -->
                        </ul>
                    </div>
                `;
                infowindow.setContent(content); // 情報ウィンドウに内容を設定
                infowindow.open(map, marker); // 情報ウィンドウを表示
            }
        });
    });
}

// 評価を星マークで表示する関数
function getStarRating(rating) {
    const fullStar = '&#9733;'; // 全星
    const halfStar = '&#9734;'; // 半星
    const emptyStar = '&#9734;'; // 空星
    let starRating = '';

    // 0から5までの星で評価を表示
    for (let i = 0; i < 5; i++) {
        if (rating >= i + 0.8) {
            starRating += fullStar; // 満点の星
        } else if (rating >= i + 0.3) {
            starRating += halfStar; // 半分の星
        } else {
            starRating += emptyStar; // 空の星
        }
    }
    return starRating;
}

// ローディング状態をリセットする関数
function resetLoadingState() {
    document.getElementById('findCafes').disabled = false; // ボタンを再度有効化
    document.getElementById('loading').style.display = 'none'; // ローディング表示を非表示に
}

