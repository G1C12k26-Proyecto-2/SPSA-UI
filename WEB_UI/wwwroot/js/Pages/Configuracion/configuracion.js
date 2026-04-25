const API_URL = "https://spsaapi.azurewebsites.net";

const CAMPO_MAP = {
    'NOMBRE_SISTEMA': 'txtNombreSistema',
    'ANIO_FISCAL': 'txtAnioFiscal',
    'DIA_PAGO': 'txtDiaPago',
    'PRECIO_BASE_HA': 'txtPrecioBase',
    'TOPE_MAXIMO_AJUSTE': 'txtTopeMaximo',
    'AJUSTE_BOSQUE_PRIMARIO': 'txtBosquePrimario',
    'AJUSTE_BOSQUE_SECUNDARIO': 'txtBosqueSecundario',
    'AJUSTE_PLANTACION': 'txtPlantacion',
    'AJUSTE_RIOS': 'txtRios',
    'AJUSTE_NACIENTES': 'txtNacientes',
    'AJUSTE_PENDIENTE_INCLINADA': 'txtPendienteInclinada',
    'AJUSTE_PENDIENTE_MUY': 'txtPendienteMuy'
};

let parametrosCargados = [];

function ConfiguracionView() {

    this.InitView = () => {
        this.CargarParametros();
        $('#btnGuardar').click(() => this.GuardarCambios());
        $('#btnCancelar').click(() => this.CargarParametros());
    };

    this.CargarParametros = () => {
        $.ajax({
            url: API_URL + "/api/Parametro/GetAllParametros",
            method: "GET",
            dataType: "json"
        }).done((response) => {
            if (response.result === "ok") {
                parametrosCargados = response.data;
                this.LlenarFormulario(response.data);
            } else {
                ShowError('Error', response.message || 'No se pudieron cargar los parámetros.');
            }
        }).fail(() => {
            ShowError('Error de conexión', 'No se pudo conectar con el servidor.');
        });
    };

    this.LlenarFormulario = (parametros) => {
        parametros.forEach(p => {
            const inputId = CAMPO_MAP[p.clave];
            if (inputId) {
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = p.valor;
                    if (!p.esEditable) {
                        input.disabled = true;
                        input.title = 'Este parámetro no es editable';
                    }
                }
            }
        });
    };

    this.GuardarCambios = () => {
        const userId = parseInt(sessionStorage.getItem('userId')) || null;
        const cambios = [];

        parametrosCargados.forEach(p => {
            const inputId = CAMPO_MAP[p.clave];
            if (!inputId || !p.esEditable) return;

            const input = document.getElementById(inputId);
            if (!input) return;

            const nuevoValor = input.value.trim();
            if (nuevoValor !== p.valor) {
                cambios.push({
                    id: p.id,
                    valor: nuevoValor,
                    usuarioActualizaId: userId
                });
            }
        });

        if (cambios.length === 0) {
            ShowError('Sin cambios', 'No hay cambios para guardar.');
            return;
        }

        $('#btnGuardar').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Guardando...');

        const promesas = cambios.map(cambio =>
            $.ajax({
                url: API_URL + "/api/Parametro/UpdateParametro",
                method: "PUT",
                dataType: "json",
                contentType: "application/json;charset=utf-8",
                data: JSON.stringify(cambio)
            })
        );

        Promise.all(promesas.map(p => p.catch(e => e)))
            .then(resultados => {
                const errores = resultados.filter(r => r && r.result === 'error');
                if (errores.length === 0) {
                    ShowSuccess('Guardado', `${cambios.length} parámetro(s) actualizado(s) correctamente.`);
                    this.CargarParametros();
                } else {
                    ShowError('Error parcial', 'Algunos parámetros no se pudieron guardar.');
                }
            })
            .finally(() => {
                $('#btnGuardar').prop('disabled', false).html('<i class="fas fa-save"></i> Guardar Cambios');
            });
    };
}

$(document).ready(function () {
    const view = new ConfiguracionView();
    view.InitView();
});