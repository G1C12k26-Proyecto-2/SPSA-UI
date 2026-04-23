let map;
let marker;

function CrearFinca() {

    this.InitView = function () {
        this.InitializeChips();
        $("#btnEnviar").click(() => this.Submit());
        $("#btnBorrador").click(() => this.SaveDraft());
    };

    this.InitializeChips = function () {
        $(".psa-chip").click(function () {
            const isMulti = $(this).parent().data("multi");

            if (!isMulti) {
                $(this).siblings().removeClass("selected");
            }

            $(this).toggleClass("selected");
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

        $("#hdnLat").val(lat);
        $("#hdnLng").val(lng);
        $("#txtCoordenadas").text(`Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

        this.ResolveLocation(lat, lng);

        marker.addListener("dragend", (event) => {
            const newLat = event.latLng.lat();
            const newLng = event.latLng.lng();

            $("#hdnLat").val(newLat);
            $("#hdnLng").val(newLng);
            $("#txtCoordenadas").text(`Coordenadas: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);

            this.ResolveLocation(newLat, newLng);
        });

        marker.addListener("click", () => {
            const pos = marker.getPosition();
            this.ResolveLocation(pos.lat(), pos.lng());
        });
    };

    this.ResolveLocation = function (lat, lng) {
        $.ajax({
            url: API_URL_BASE + "/api/Maps/reverse-geocode?latitude=" + lat + "&longitude=" + lng,
            method: "GET",
            dataType: "json"
        }).done((response) => {
            if (response.result === "ok") {
                $("#hdnAddress").val(response.data.address);
                $("#hdnPlaceId").val(response.data.placeId);
                this.ResolveUbicacion(response.data.address);
            } else {
                console.warn("Error resolviendo coordenadas: " + response.message);
            }
        }).fail((xhr) => {
            console.warn("Error en reverse-geocode: " + xhr.statusText);
        });
    };

    this.ResolveUbicacion = function (address) {
        $.ajax({
            url: API_URL_BASE + "/api/Ubicaciones/ResolveFromAddress?address=" + encodeURIComponent(address),
            method: "GET",
            dataType: "json"
        }).done((response) => {
            if (response.result === "ok") {
                $("#txtProvincia").val(response.data.provincia || "");
                $("#txtCanton").val(response.data.canton || "");
                $("#txtDistrito").val(response.data.distrito || "");
            } else {
                console.warn("No se pudo resolver ubicación: " + response.message);
            }
        }).fail((xhr) => {
            // TODO: manejar error en ResolveFromAddress
            console.warn("Error resolviendo ubicación desde dirección");
        });
    };

    this.Submit = function () {
        const nombre = $("#txtNombre").val();
        const hectareas = $("#txtHectareas").val();
        const lat = $("#hdnLat").val();

        if (!nombre || nombre.trim() === "") {
            alert("Debe ingresar el nombre de la finca.");
            return;
        }

        if (!hectareas || parseFloat(hectareas) <= 0) {
            alert("Debe ingresar un tamaño válido en hectáreas.");
            return;
        }

        if (!lat) {
            alert("Debe seleccionar una ubicación en el mapa.");
            return;
        }

        // TODO: implementar envío real del formulario
        console.log("Enviando solicitud...");
        alert("TODO: implementar envío de solicitud");
    };

    this.SaveDraft = function () {
        // TODO: implementar guardar borrador
        alert("TODO: implementar guardar borrador");
    };
}

const view = new CrearFinca();

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
