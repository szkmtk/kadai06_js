let map;
let service;
let infowindow;
let userMarker;

document.getElementById('findCafes').addEventListener('click', function() {
    this.disabled = true;
    document.getElementById('loading').style.display = 'block';

    if (typeof google === 'object' && typeof google.maps === 'object') {
        initMap();
    } else {
        alert('Google Maps APIのロードを待っています。もう一度試してください。');
        resetLoadingState();
    }
});

function initMap() {
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

            // ユーザーの現在地に特別なマーカーを設置
            userMarker = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: "Your Location",
                icon: {
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png", // 青いピンを使用
                    scaledSize: new google.maps.Size(40, 40) // アイコンのサイズを調整
                }
            });

            const request = {
                location: userLocation,
                radius: '500',
                keyword: '電源のあるカフェ',
                type: ['cafe']
            };

            infowindow = new google.maps.InfoWindow();
            service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, callback);
        }, () => {
            handleLocationError(true, infowindow, map.getCenter());
            resetLoadingState();
        });
    } else {
        handleLocationError(false, infowindow, map.getCenter());
        resetLoadingState();
    }
}

function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        results.forEach(createMarker);
    }
    resetLoadingState();
}

function createMarker(place) {
    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new google.maps.Size(40, 40)
        }
    });

    google.maps.event.addListener(marker, 'click', () => {
        const request = {
            placeId: place.place_id,
            fields: ['name', 'formatted_address', 'photos', 'rating', 'reviews', 'opening_hours']
        };

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
                infowindow.setContent(content);
                infowindow.open(map, marker);
            }
        });
    });
}

function getStarRating(rating) {
    const fullStar = '&#9733;';
    const halfStar = '&#9734;';
    const emptyStar = '&#9734;';
    let starRating = '';

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

function handleLocationError(browserHasGeolocation, infowindow, pos) {
    infowindow.setPosition(pos);
    infowindow.setContent(browserHasGeolocation ? 'Error: The Geolocation service failed.' : 'Error: Your browser doesn\'t support geolocation.');
    infowindow.open(map);
}

function resetLoadingState() {
    document.getElementById('findCafes').disabled = false;
    document.getElementById('loading').style.display = 'none';
}