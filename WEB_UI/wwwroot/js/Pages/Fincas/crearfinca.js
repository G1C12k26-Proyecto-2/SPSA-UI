function CrearFinca() {
    let map, marker;
    let fotosUrls = [];
    let docsUrls = [];

    this.InitView = () => {
        window.crearFincaInstance = this;

        $(document).on('click', '.psa-chip', function () {
            const group = $(this).closest('.psa-chip-group');
            if (group.data('multi') === true) {
                if (group.data('field') === 'hidrico') {
                    if ($(this).data('value') === 'ninguno') {
                        group.find('.psa-chip').removeClass('selected');
                        $(this).addClass('selected');
                    } else {
                        group.find('[data-value="ninguno"]').removeClass('selected');
                        $(this).toggleClass('selected');
                    }
                } else {
                    $(this).toggleClass('selected');
                }
            } else {
                group.find('.psa-chip').removeClass('selected');
                $(this).addClass('selected');
            }
        });

        $('#btnEnviar').click(() => this.Submit());
        $('#btnBorrador').click(() => this.SaveBorrador());

        this.LoadBorradores();

        $('#uploadFotos').click(() => $('#inputFotos').trigger('click'));
        $('#uploadDocs').click(() => $('#inputDocs').trigger('click'));

        $(document).on('mouseenter', '.file-preview-card', function() {
            $(this).find('.file-remove-btn').css('display', 'flex');
        });
        $(document).on('mouseleave', '.file-preview-card', function() {
            $(this).find('.file-remove-btn').css('display', 'none');
        });
        $(document).on('click', '.file-remove-btn', function(e) {
            e.stopPropagation();
            const card = $(this).closest('.file-preview-card');
            const index = parseInt(card.data('index'));
            const type = card.data('type');
            if (type === 'foto') {
                fotosUrls.splice(index, 1);
                $('#previewFotos').find('.file-preview-card').each(function(i) { $(this).attr('data-index', i); });
                if (fotosUrls.length === 0) $('#uploadFotos').html('<i class="fas fa-camera"></i><p>Arrastra imágenes o haz clic</p><small>JPG, PNG · máx. 10MB</small>');
                else $('#uploadFotos').html('<i class="fas fa-check text-success"></i><p>' + fotosUrls.length + ' foto(s) subida(s)</p>');
            } else {
                docsUrls.splice(index, 1);
                $('#previewDocs').find('.file-preview-card').each(function(i) { $(this).attr('data-index', i); });
                if (docsUrls.length === 0) $('#uploadDocs').html('<i class="fas fa-file-arrow-up"></i><p>Plano catastrado, escritura, etc.</p><small>PDF · máx. 25MB</small>');
                else $('#uploadDocs').html('<i class="fas fa-check text-success"></i><p>' + docsUrls.length + ' documento(s) subido(s)</p>');
            }
            card.remove();
        });

        $('#inputFotos').on('change', async function() {
            const files = this.files;
            if (!files || files.length === 0) return;
            $('#uploadFotos').html('<i class="fas fa-spinner fa-spin"></i><p>Subiendo fotos...</p>');
            const result = await crearFincaInstance.UploadFiles(files, 'fincas/fotos');
            fotosUrls = result;
            $('#uploadFotos').html('<i class="fas fa-check text-success"></i><p>' + files.length + ' foto(s) subida(s)</p>');
            $('#previewFotos').empty();
            fotosUrls.forEach((url, i) => {
                $('#previewFotos').append(`
        <div class="file-preview-card" data-index="${i}" data-type="foto" style="position:relative;display:inline-block;width:60px;height:60px;border-radius:8px;overflow:hidden;margin:2px;">
            <img src="${url}" style="width:60px;height:60px;object-fit:cover;display:block;" />
            <div class="file-remove-btn" style="display:none;position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:white;border-radius:50%;width:18px;height:18px;font-size:11px;align-items:center;justify-content:center;cursor:pointer;">✕</div>
        </div>
    `);
            });
        });

        $('#inputDocs').on('change', async function() {
            const files = this.files;
            if (!files || files.length === 0) return;
            $('#uploadDocs').html('<i class="fas fa-spinner fa-spin"></i><p>Subiendo documentos...</p>');
            const result = await crearFincaInstance.UploadFiles(files, 'fincas/documentos');
            docsUrls = result;
            $('#uploadDocs').html('<i class="fas fa-check text-success"></i><p>' + files.length + ' documento(s) subido(s)</p>');
            $('#previewDocs').empty();
            docsUrls.forEach((url, i) => {
                $('#previewDocs').append(`
        <div class="file-preview-card" data-index="${i}" data-type="doc" style="position:relative;display:inline-flex;align-items:center;gap:4px;background:#f1f5f2;border:1px solid #ccc;border-radius:8px;padding:4px 8px;margin:2px;">
            <i class="fas fa-file-pdf text-danger"></i>
            <span style="font-size:12px;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Doc ${i + 1}</span>
            <div class="file-remove-btn" style="display:none;background:rgba(0,0,0,0.6);color:white;border-radius:50%;width:16px;height:16px;font-size:10px;align-items:center;justify-content:center;cursor:pointer;margin-left:2px;">✕</div>
        </div>
    `);
            });
        });
    };

    this.InitMap = () => {
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 10.4628, lng: -84.6426 },
            zoom: 9,
            mapTypeId: 'hybrid',
            streetViewControl: false,
            fullscreenControl: true
        });

        map.addListener('click', (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            this.SetMarker(lat, lng);
            this.ReverseGeocode(lat, lng);
        });
    };

    this.SetMarker = (lat, lng) => {
        if (marker) marker.setMap(null);
        marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            animation: google.maps.Animation.DROP,
            title: 'Ubicación de la finca'
        });
        $('#hfLatitud').val(lat);
        $('#hfLongitud').val(lng);
        $('#lblCoordenadas').text(`${lat.toFixed(6)}° N, ${lng.toFixed(6)}° W`);
    };

    this.ReverseGeocode = (lat, lng) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status !== 'OK' || !results[0]) return;

            const components = results[0].address_components;

            const get = (...types) => {
                for (const type of types) {
                    const c = components.find(c => c.types.includes(type));
                    if (c) return c.long_name;
                }
                return '';
            };

            const provincia = get('administrative_area_level_1');
            const canton = get('administrative_area_level_2', 'locality', 'sublocality_level_1');
            const distrito = get('administrative_area_level_3', 'neighborhood', 'sublocality_level_2', 'locality');

            $('#ddlProvincia').val(provincia || '');
            $('#ddlCanton').val(canton || '');
            $('#ddlDistrito').val(distrito || '');
        });
    };

    this.GetChipValue = (field) => {
        return $(`[data-field="${field}"] .psa-chip.selected`).first().data('value') || '';
    };

    this.GetChipValues = (field) => {
        const values = [];
        $(`[data-field="${field}"] .psa-chip.selected`).each(function () {
            values.push($(this).data('value'));
        });
        return values;
    };

    this.LoadBorradores = () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.id) return;

        $.ajax({
            url: API_URL_BASE + '/api/Solicitudes/Borradores/' + user.id,
            method: 'GET',
            success: (res) => {
                if (res.result !== 'ok' || !res.data || res.data.length === 0) {
                    $('#seccionBorradores').hide();
                    return;
                }

                $('#seccionBorradores').show();
                $('#listaBorradores').empty();

                res.data.forEach(b => {
                    const fecha = new Date(b.fechaSolicitud).toLocaleDateString('es-CR');
                    const card = `
                        <div class="col-md-6">
                            <div class="psa-borrador-card" data-id="${b.idSolicitud}">
                                <div class="psa-card" style="border-left: 4px solid var(--psa-gold); position:relative; cursor:pointer; transition: box-shadow 0.2s;">
                                    <div class="psa-card-body d-flex justify-content-between align-items-center">
                                        <div>
                                            <div class="fw-semibold"><i class="fas fa-floppy-disk me-2" style="color:var(--psa-gold);"></i>${b.nombreFinca}</div>
                                            <small class="text-muted">Guardado el ${fecha}</small>
                                        </div>
                                        <span class="psa-badge psa-badge-muted">Borrador</span>
                                    </div>
                                    <div class="psa-borrador-overlay" style="display:none; position:absolute; inset:0; background:transparent; border-radius:inherit; align-items:center; justify-content:center; gap:12px;">
                                        <button class="btn btn-psa btn-sm btnEditarBorrador" data-id="${b.idSolicitud}">
                                            <i class="fas fa-pen me-1"></i> Editar
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm btnEliminarBorrador" data-id="${b.idSolicitud}">
                                            <i class="fas fa-trash me-1"></i> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                    $('#listaBorradores').append(card);
                });

                $(document).off('mouseenter', '.psa-borrador-card').on('mouseenter', '.psa-borrador-card', function () {
                    $(this).find('.psa-borrador-overlay').css('display', 'flex');
                });
                $(document).off('mouseleave', '.psa-borrador-card').on('mouseleave', '.psa-borrador-card', function () {
                    $(this).find('.psa-borrador-overlay').hide();
                });

                $(document).off('click', '.btnEliminarBorrador').on('click', '.btnEliminarBorrador', (e) => {
                    e.stopPropagation();
                    const id = $(e.currentTarget).data('id');
                    ShowConfirm('Eliminar borrador', '¿Estás seguro de eliminar este borrador?', () => {
                        $.ajax({
                            url: API_URL_BASE + '/api/Solicitudes/Delete/' + id,
                            method: 'DELETE',
                            success: (res) => {
                                if (res.result === 'ok') {
                                    ShowSuccess('Eliminado', 'Borrador eliminado correctamente.');
                                    setTimeout(() => this.LoadBorradores(), 1000);
                                } else {
                                    ShowError('Error', res.message || 'No se pudo eliminar.');
                                }
                            },
                            error: () => ShowError('Error', 'No se pudo conectar con el servidor.')
                        });
                    });
                });

                $(document).off('click', '.btnEditarBorrador').on('click', '.btnEditarBorrador', (e) => {
                    e.stopPropagation();
                    const id = $(e.currentTarget).data('id');
                    $.ajax({
                        url: API_URL_BASE + '/api/Solicitudes/GetById/' + id,
                        method: 'GET',
                        success: (res) => {
                            if (res.result !== 'ok') {
                                ShowError('Error', 'No se pudo cargar el borrador.');
                                return;
                            }
                            const b = res.data;

                            $('#frmCrear').data('borradorId', id);
                            $('#txtNombre').val(b.nombreFinca || '');
                            $('#ddlProvincia').val(b.provincia || '');
                            $('#ddlCanton').val(b.canton || '');
                            $('#ddlDistrito').val(b.distrito || b.distritoTexto || '');
                            $('#txtHectareas').val(b.hectareasOriginal || '');

                            if (b.pendienteOriginal) {
                                $('[data-field="pendiente"] .psa-chip').removeClass('selected');
                                $(`[data-field="pendiente"] [data-value="${b.pendienteOriginal}"]`).addClass('selected');
                            }

                            if (b.tipoVegetacionOriginal) {
                                $('[data-field="vegetacion"] .psa-chip').removeClass('selected');
                                $(`[data-field="vegetacion"] [data-value="${b.tipoVegetacionOriginal}"]`).addClass('selected');
                            }

                            $('[data-field="hidrico"] .psa-chip').removeClass('selected');
                            if (b.tieneRiosQuebradasOriginal) {
                                $('[data-field="hidrico"] [data-value="rios"]').addClass('selected');
                            }
                            if (b.cantidadNacientesOriginal > 0) {
                                $('[data-field="hidrico"] [data-value="nacientes"]').addClass('selected');
                                $('#txtNacientes').val(b.cantidadNacientesOriginal);
                            }
                            if (!b.tieneRiosQuebradasOriginal && !b.cantidadNacientesOriginal) {
                                $('[data-field="hidrico"] [data-value="ninguno"]').addClass('selected');
                            }

                            $('[data-field="usosuelo"] .psa-chip').removeClass('selected');
                            if (b.usoSueloOriginal) {
                                b.usoSueloOriginal.split(',').map(v => v.trim()).forEach(v => {
                                    $(`[data-field="usosuelo"] [data-value="${v}"]`).addClass('selected');
                                });
                            }

                            if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
                                if (!map) {
                                    this.InitMap();
                                } else {
                                    setTimeout(() => {
                                        google.maps.event.trigger(map, 'resize');
                                        map.setCenter({ lat: 10.4628, lng: -84.6426 });
                                    }, 300);
                                }
                            }

                            $('html, body').animate({ scrollTop: $('#frmCrear').offset().top - 20 }, 400);
                        },
                        error: () => ShowError('Error', 'No se pudo conectar con el servidor.')
                    });
                });
            },
            error: () => $('#seccionBorradores').hide()
        });
    };

    this.SaveBorrador = () => {
        const nombre = $('#txtNombre').val().trim();
        if (!nombre) {
            ShowError('Campo requerido', 'El nombre de la finca es obligatorio para guardar el borrador.');
            return;
        }

        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.id) {
            ShowError('Sesión inválida', 'No se pudo obtener el usuario. Inicie sesión nuevamente.');
            return;
        }

        $.ajax({
            url: API_URL_BASE + '/api/Solicitudes/Borradores/' + user.id,
            method: 'GET',
            success: (res) => {
                if (res.result === 'ok' && res.data && res.data.length >= 2) {
                    ShowError('Límite alcanzado', 'Ya tienes 2 borradores guardados. Elimina uno antes de guardar otro.');
                    return;
                }

                const hectareas = $('#txtHectareas').val();
                const pendiente = this.GetChipValue('pendiente');
                const vegetacion = this.GetChipValue('vegetacion');
                const hidricos = this.GetChipValues('hidrico');
                const usoSuelos = this.GetChipValues('usosuelo');
                const nacientes = parseInt($('#txtNacientes').val()) || 0;
                const tieneRios = hidricos.includes('rios');
                const usoSuelo = usoSuelos.join(', ');
                const provincia = $('#ddlProvincia').val().trim();
                const canton = $('#ddlCanton').val().trim();
                const distrito = $('#ddlDistrito').val().trim();

                const saveBorrador = (idProvincia, idCanton, idDistrito) => {
                    const payload = {
                        usuarioId: user.id,
                        nombreFinca: nombre,
                        idProvincia: idProvincia,
                        idCanton: idCanton,
                        idDistrito: idDistrito,
                        distritoTexto: idDistrito ? null : (distrito || null),
                        hectareasOriginal: hectareas ? parseFloat(hectareas) : null,
                        pendienteOriginal: pendiente || null,
                        tipoVegetacionOriginal: vegetacion || null,
                        tieneRiosQuebradasOriginal: tieneRios,
                        cantidadNacientesOriginal: nacientes,
                        usoSueloOriginal: usoSuelo || null,
                        estado: 'Borrador',
                        fotosUrls: JSON.stringify(fotosUrls),
                        documentosUrls: JSON.stringify(docsUrls)
                    };

                    $.ajax({
                        url: API_URL_BASE + '/api/Solicitudes/Create',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(payload),
                        success: (res2) => {
                            if (res2.result === 'ok' || res2.result === 'success') {
                                ShowSuccess('Borrador guardado', 'Tu borrador fue guardado correctamente.');
                                setTimeout(() => location.reload(), 1500);
                            } else {
                                ShowError('Error', res2.message || 'No se pudo guardar el borrador.');
                            }
                        },
                        error: () => ShowError('Error', 'No se pudo conectar con el servidor.')
                    });
                };

                if (provincia && canton) {
                    $.ajax({
                        url: API_URL_BASE + '/api/Ubicaciones/Resolve',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ provincia, canton, distrito }),
                        success: (resUbic) => {
                            if (resUbic.result === 'success' && resUbic.data) {
                                saveBorrador(resUbic.data.idProvincia || null, resUbic.data.idCanton || null, resUbic.data.idDistrito || null);
                            } else {
                                saveBorrador(null, null, null);
                            }
                        },
                        error: () => saveBorrador(null, null, null)
                    });
                } else {
                    saveBorrador(null, null, null);
                }
            },
            error: () => ShowError('Error', 'No se pudo verificar los borradores.')
        });
    };

    this.Submit = () => {
        const nombre = $('#txtNombre').val().trim();
        const hectareas = $('#txtHectareas').val();
        const lat = $('#hfLatitud').val();
        const lng = $('#hfLongitud').val();
        const provincia = $('#ddlProvincia').val().trim();
        const canton = $('#ddlCanton').val().trim();
        const distrito = $('#ddlDistrito').val().trim();

        if (!nombre || !hectareas) {
            ShowError('Campos requeridos', 'Nombre y hectáreas son obligatorios.');
            return;
        }
        if (!lat || !lng) {
            ShowError('Ubicación requerida', 'Por favor seleccione una ubicación en el mapa.');
            return;
        }
        if (!provincia || !canton) {
            ShowError('Ubicación incompleta', 'Provincia y cantón son obligatorios.');
            return;
        }

        const pendiente = this.GetChipValue('pendiente');
        const vegetacion = this.GetChipValue('vegetacion');
        const hidricos = this.GetChipValues('hidrico');
        const usoSuelos = this.GetChipValues('usosuelo');

        if (!pendiente) {
            ShowError('Campo requerido', 'Seleccione el tipo de superficie.');
            return;
        }
        if (!vegetacion) {
            ShowError('Campo requerido', 'Seleccione el tipo de vegetación.');
            return;
        }
        if (hidricos.length === 0) {
            ShowError('Campo requerido', 'Seleccione al menos un recurso hídrico.');
            return;
        }
        if (usoSuelos.length === 0) {
            ShowError('Campo requerido', 'Seleccione al menos un uso de suelo.');
            return;
        }

        const nacientes = parseInt($('#txtNacientes').val()) || 0;

        if (hidricos.includes('nacientes') && nacientes === 0) {
            ShowError('Campo requerido', 'Ingrese la cantidad de nacientes.');
            return;
        }
        const tieneRios = hidricos.includes('rios');
        const usoSuelo = usoSuelos.join(', ');

        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.id) {
            ShowError('Sesión inválida', 'No se pudo obtener el usuario. Inicie sesión nuevamente.');
            return;
        }

        ShowConfirm('Enviar solicitud', '¿Está seguro de enviar la solicitud? Una vez enviada, pasará a revisión.', () => {
            $.ajax({
                url: API_URL_BASE + '/api/Ubicaciones/Resolve',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ provincia, canton, distrito }),
                success: (res) => {
                    if (res.result !== 'success') {
                        ShowError('Error', 'No se pudieron resolver las ubicaciones.');
                        return;
                    }

                    const ubicacion = res.data;

                    const payload = {
                        usuarioId: user.id,
                        nombreFinca: nombre,
                        idProvincia: ubicacion.idProvincia || null,
                        idCanton: ubicacion.idCanton || null,
                        idDistrito: ubicacion.idDistrito || null,
                        distritoTexto: $('#ddlDistrito').val() || null,
                        hectareasOriginal: parseFloat(hectareas),
                        pendienteOriginal: pendiente,
                        tipoVegetacionOriginal: vegetacion,
                        tieneRiosQuebradasOriginal: tieneRios,
                        cantidadNacientesOriginal: nacientes,
                        usoSueloOriginal: usoSuelo,
                        fotosUrls: JSON.stringify(fotosUrls),
                        documentosUrls: JSON.stringify(docsUrls)
                    };

                    $.ajax({
                        url: API_URL_BASE + '/api/Solicitudes/Create',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(payload),
                        success: (res2) => {
                            if (res2.result === 'ok' || res2.result === 'success') {
                                ShowSuccess('Solicitud enviada', 'Su finca fue registrada y está pendiente de revisión.');
                                const borradorId = $('#frmCrear').data('borradorId');
                                if (borradorId) {
                                    $.ajax({
                                        url: API_URL_BASE + '/api/Solicitudes/Delete/' + borradorId,
                                        method: 'DELETE',
                                        complete: () => setTimeout(() => { window.location = '/Fincas'; }, 2000)
                                    });
                                } else {
                                    setTimeout(() => { window.location = '/Fincas'; }, 2000);
                                }
                            } else {
                                ShowError('Error', res2.message || 'No se pudo registrar la finca.');
                            }
                        },
                        error: () => ShowError('Error', 'No se pudo conectar con el servidor.')
                    });
                },
                error: () => ShowError('Error', 'No se pudo resolver la ubicación.')
            });
        });
    };

    this.UploadFiles = async (files, folder) => {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        try {
            const response = await fetch(API_URL_BASE + '/api/cloudinary/upload-multiple?folder=' + folder, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                return data.filter(f => f.success).map(f => f.secureUrl || f.url);
            }
            return [];
        } catch (e) {
            console.error('Error subiendo archivos:', e);
            return [];
        }
    };
}

$(document).ready(() => {
    let v = new CrearFinca();
    v.InitView();
});