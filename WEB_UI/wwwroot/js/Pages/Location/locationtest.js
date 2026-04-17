let map;
let marker;

function LocationTestView() {

    this.InitView = function () {
        $("#btnGeocode").click(() => this.GeocodeAddress());
        $("#btnSaveLocation").click(() => this.SaveLocation());
        $("#btnRetrieveAll").click(() => this.RetrieveAllLocations());
    };

    this.GeocodeAddress = function () {
        const address = $("#txtAddress").val();

        if (!address || address.trim() === "") {
            alert("Debe ingresar una dirección.");
            return;
        }

        $.ajax({
            url: API_URL_BASE + "/api/Maps/geocode?address=" + encodeURIComponent(address),
            method: "GET",
            dataType: "json"
        }).done((response) => {
            if (response.result === "ok") {
                const lat = parseFloat(response.data.latitude);
                const lng = parseFloat(response.data.longitude);

                map.setCenter({ lat: lat, lng: lng });
                map.setZoom(17);

                this.SetPinLocation(lat, lng);
            } else {
                alert(response.message);
            }
        }).fail(function (xhr) {
            console.error(xhr);
            alert("Error consultando geocode.");
        });
    };

    this.SetPinLocation = function (lat, lng) {
        const position = { lat: lat, lng: lng };

        if (marker) {
            marker.setMap(null);
        }

        marker = new google.maps.Marker({
            position: position,
            map: map,
            draggable: true
        });

        $("#txtLatitude").val(lat);
        $("#txtLongitude").val(lng);

        this.ResolveClickedLocation(lat, lng);

        marker.addListener("dragend", (event) => {
            const newLat = event.latLng.lat();
            const newLng = event.latLng.lng();

            $("#txtLatitude").val(newLat);
            $("#txtLongitude").val(newLng);

            this.ResolveClickedLocation(newLat, newLng);
        });

        marker.addListener("click", () => {
            const pos = marker.getPosition();
            this.ResolveClickedLocation(pos.lat(), pos.lng());
        });
    };

    this.SaveLocation = function () {
        const location = {
            address: $("#txtFormattedAddress").val(),
            latitude: parseFloat($("#txtLatitude").val()),
            longitude: parseFloat($("#txtLongitude").val()),
            placeId: $("#txtPlaceId").val()
        };

        if (!location.address) {
            alert("Primero debe seleccionar o mover el pin.");
            return;
        }

        $.ajax({
            url: API_URL_BASE + "/api/Location/Create",
            method: "POST",
            contentType: "application/json;charset=utf-8",
            dataType: "json",
            data: JSON.stringify(location)
        }).done(function (response) {
            if (response.result === "ok") {
                alert("Ubicación guardada correctamente.");
            } else {
                alert(response.message);
            }
        }).fail(function (xhr) {
            console.error(xhr);
            alert("Error guardando la ubicación.");
        });
    };

    this.RetrieveAllLocations = function () {
        $.ajax({
            url: API_URL_BASE + "/api/Location/RetrieveAll",
            method: "GET",
            dataType: "json"
        }).done(function (response) {
            if (response.result === "ok") {
                $("#locationsResult").text(JSON.stringify(response.data, null, 2));
            } else {
                alert(response.message);
            }
        }).fail(function (xhr) {
            console.error(xhr);
            alert("Error consultando ubicaciones.");
        });
    };

    this.ResolveClickedLocation = function (lat, lng) {
        $.ajax({
            url: API_URL_BASE + "/api/Maps/reverse-geocode?latitude=" + lat + "&longitude=" + lng,
            method: "GET",
            dataType: "json"
        }).done(function (response) {
            if (response.result === "ok") {
                $("#txtFormattedAddress").val(response.data.address);
                $("#txtLatitude").val(response.data.latitude);
                $("#txtLongitude").val(response.data.longitude);
                $("#txtPlaceId").val(response.data.placeId);

                $("#selectedAddressLine").text(response.data.address);
            } else {
                $("#selectedAddressLine").text("No se pudo resolver la dirección del pin.");
                alert(response.message);
            }
        }).fail(function (xhr) {
            console.error(xhr);
            $("#selectedAddressLine").text("Error resolviendo la ubicación seleccionada.");
            alert("Error resolviendo la ubicación seleccionada.");
        });
    };
}

const view = new LocationTestView();

function initMap() {
    const initialPosition = { lat: 9.9281, lng: -84.0907 };

    map = new google.maps.Map(document.getElementById("map"), {
        center: initialPosition,
        zoom: 8
    });

    map.addListener("click", (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        view.SetPinLocation(lat, lng);
    });

    view.InitView();
}