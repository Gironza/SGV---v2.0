import logging
from app.config.database import BaseDatosNoDisponible
from app.models.candidato import (
    Candidato, ESTADO_APROBADA, ESTADO_RECHAZADA, ESTADO_RETIRADA,
    ESTADO_RETIRO_SOLICITADO
)
from app.models.eleccion import Eleccion
from app.utils.acceso import obtener_eleccion_de_institucion
from app.utils.etapas import (
    calcular_etapa, ETAPA_PUBLICADA, ETAPA_POSTULACION, ETAPAS_SIN_INICIAR
)
from app.utils.imagenes import (
    FotoInvalida, MAX_BYTES_FOTO, PREFIJO_URL_FOTOS,
    procesar_foto, guardar_foto, eliminar_archivo_foto
)

logger = logging.getLogger(__name__)

ROL_ESTUDIANTE = 3

MSG_SISTEMA = 'Error en el sistema, intenta más tarde'
MSG_ELECCION_NO_ENCONTRADA = 'Elección no encontrada'
MSG_CANDIDATURA_NO_ENCONTRADA = 'Candidatura no encontrada'
MSG_ELECCION_INICIADA = 'La elección ya inició: las candidaturas ya no se pueden modificar'


def _fallo(mensaje, bandera=None):
    resultado = {'success': False, 'message': mensaje}
    if bandera:
        resultado[bandera] = True
    return resultado


class CandidatoController:

    @staticmethod
    def _candidatura_de_institucion(id_candidato, id_usuario):
        """
        Devuelve (candidatura, elección) solo si la elección es de la institución
        del usuario. Si no existe o es de otra institución devuelve (None, None):
        el cliente recibe el mismo mensaje y no se revela que existe.
        """
        candidato = Candidato.obtener_por_id(id_candidato)
        if not candidato:
            return None, None
        eleccion = obtener_eleccion_de_institucion(candidato['id_eleccion'], id_usuario)
        if not eleccion:
            return None, None
        return candidato, eleccion

    # ---------- Estudiante / candidato ----------

    def inscribir(self, id_usuario, id_eleccion):
        """Postularse con un clic: queda Pendiente. Solo en etapa de postulación."""
        try:
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return _fallo(MSG_ELECCION_NO_ENCONTRADA, 'no_encontrado')

            etapa = calcular_etapa(eleccion)
            if etapa != ETAPA_POSTULACION:
                if etapa == ETAPA_PUBLICADA:
                    return _fallo('Las postulaciones de esta elección aún no han abierto')
                return _fallo('El periodo de postulación de esta elección ya cerró')

            if Candidato.ya_inscrito(id_usuario, id_eleccion):
                return _fallo('Ya te postulaste en esta elección', 'conflicto')

            id_candidato = Candidato.crear(id_usuario, id_eleccion)
            if id_candidato is None:
                return _fallo('Error al registrar la postulación', 'error_sistema')

            return {
                'success': True,
                'message': 'Postulación enviada, queda pendiente de aprobación',
                'id_candidato': id_candidato
            }
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al inscribir candidato: {e}")
            return _fallo(MSG_SISTEMA, 'error_sistema')

    @staticmethod
    def _candidatura_editable_por_dueno(id_candidato, id_usuario, que):
        """
        Reglas para editar contenido de la candidatura (propuesta o foto):
        dueño, candidatura aprobada y etapa de postulación.
        Devuelve (candidatura, None) si todo está bien, o (None, fallo) si no.
        """
        candidato = Candidato.obtener_por_id(id_candidato)
        if not candidato:
            return None, _fallo(MSG_CANDIDATURA_NO_ENCONTRADA, 'no_encontrado')
        if candidato['id_usuario'] != id_usuario:
            return None, _fallo('No puedes editar la candidatura de otro estudiante', 'prohibido')

        if candidato['id_estado_candidatura'] != ESTADO_APROBADA:
            return None, _fallo(f'Solo puedes editar tu {que} cuando tu candidatura esté aprobada')

        eleccion = Eleccion.obtener_por_id(candidato['id_eleccion'])
        if not eleccion:
            return None, _fallo(MSG_ELECCION_NO_ENCONTRADA, 'no_encontrado')
        if calcular_etapa(eleccion) != ETAPA_POSTULACION:
            return None, _fallo(f'La {que} solo se puede editar mientras está abierto el periodo de postulación')

        return candidato, None

    def editar_propuesta(self, id_candidato, id_usuario, propuesta):
        """El candidato dueño edita su propuesta: aprobada y en etapa de postulación."""
        try:
            propuesta = (propuesta or '').strip()
            if not propuesta:
                return _fallo('La propuesta no puede estar vacía')

            _, fallo = self._candidatura_editable_por_dueno(id_candidato, id_usuario, 'propuesta')
            if fallo:
                return fallo

            if not Candidato.actualizar_propuesta(id_candidato, propuesta):
                return _fallo('Error al guardar la propuesta', 'error_sistema')
            return {'success': True, 'message': 'Propuesta actualizada exitosamente'}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al editar propuesta: {e}")
            return _fallo(MSG_SISTEMA, 'error_sistema')


    def subir_foto(self, id_candidato, id_usuario, contenido):
        """
        Sube o reemplaza la foto. Orden pensado para no dejar basura:
        1) reglas, 2) tamaño y validación de la imagen, 3) guardar archivo,
        4) actualizar la BD, 5) recién entonces borrar el archivo anterior.
        Si la BD falla, se borra el archivo recién guardado.
        """
        try:
            candidato, fallo = self._candidatura_editable_por_dueno(id_candidato, id_usuario, 'foto')
            if fallo:
                return fallo

            if not contenido:
                return _fallo('El archivo está vacío')
            if len(contenido) > MAX_BYTES_FOTO:
                return _fallo('La foto pesa más de 2 MB', 'demasiado_grande')

            try:
                jpeg = procesar_foto(contenido)
            except FotoInvalida:
                return _fallo('El archivo no es una imagen válida. Usa JPG, PNG o WEBP')

            url_nueva = f"{PREFIJO_URL_FOTOS}/{guardar_foto(jpeg)}"

            try:
                actualizado = Candidato.actualizar_foto(id_candidato, url_nueva)
            except Exception:
                eliminar_archivo_foto(url_nueva)  # no dejar huérfano
                raise
            if not actualizado:
                eliminar_archivo_foto(url_nueva)
                return _fallo('Error al guardar la foto', 'error_sistema')

            eliminar_archivo_foto(candidato['foto'])  # la anterior, ya con la BD actualizada
            return {'success': True, 'message': 'Foto actualizada exitosamente', 'foto': url_nueva}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al subir foto: {e}")
            return _fallo(MSG_SISTEMA, 'error_sistema')

    def quitar_foto(self, id_candidato, id_usuario):
        """Quita la foto: primero la BD, después el archivo."""
        try:
            candidato, fallo = self._candidatura_editable_por_dueno(id_candidato, id_usuario, 'foto')
            if fallo:
                return fallo

            if not candidato['foto']:
                return _fallo('Tu candidatura no tiene foto')

            if not Candidato.actualizar_foto(id_candidato, None):
                return _fallo('Error al quitar la foto', 'error_sistema')

            eliminar_archivo_foto(candidato['foto'])
            return {'success': True, 'message': 'Foto eliminada exitosamente', 'foto': None}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al quitar foto: {e}")
            return _fallo(MSG_SISTEMA, 'error_sistema')

    def solicitar_retiro(self, id_candidato, id_usuario):
        """El candidato pide retirarse; queda 'Retiro solicitado' hasta que lo resuelvan."""
        try:
            candidato = Candidato.obtener_por_id(id_candidato)
            if not candidato:
                return _fallo(MSG_CANDIDATURA_NO_ENCONTRADA, 'no_encontrado')
            if candidato['id_usuario'] != id_usuario:
                return _fallo('No puedes retirar la candidatura de otro estudiante', 'prohibido')

            eleccion = Eleccion.obtener_por_id(candidato['id_eleccion'])
            if not eleccion:
                return _fallo(MSG_ELECCION_NO_ENCONTRADA, 'no_encontrado')
            if calcular_etapa(eleccion) not in ETAPAS_SIN_INICIAR:
                return _fallo('No puedes retirarte: la elección ya inició')

            estado = candidato['id_estado_candidatura']
            if estado == ESTADO_RETIRO_SOLICITADO:
                return _fallo('Ya solicitaste el retiro, espera la respuesta de un administrador o docente', 'conflicto')
            if estado != ESTADO_APROBADA:
                return _fallo('Solo puedes solicitar el retiro de una candidatura aprobada')

            if not Candidato.cambiar_estado(id_candidato, ESTADO_RETIRO_SOLICITADO):
                return _fallo('Error al solicitar el retiro', 'error_sistema')
            return {'success': True, 'message': 'Retiro solicitado, queda pendiente de respuesta'}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al solicitar retiro: {e}")
            return _fallo(MSG_SISTEMA, 'error_sistema')

    def obtener_mi_candidatura(self, id_usuario, id_eleccion):
        # El candidato consulta el estado de su propia candidatura
        try:
            candidatura = Candidato.obtener_de_usuario(id_usuario, id_eleccion)
            if not candidatura:
                return _fallo('No tienes candidatura en esta elección', 'no_encontrado')
            return {'success': True, 'candidatura': candidatura}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al obtener candidatura propia: {e}")
            return _fallo(MSG_SISTEMA, 'error_sistema')

    # ---------- Tarjetón ----------

    def listar_por_eleccion(self, id_eleccion, id_usuario, id_rol):
        """
        Tarjetón (aprobadas y retiro solicitado). Los estudiantes solo lo ven desde
        que cierra la postulación; antes consultan su candidatura en /mia.
        """
        try:
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return _fallo(MSG_ELECCION_NO_ENCONTRADA, 'no_encontrado')

            if id_rol == ROL_ESTUDIANTE and calcular_etapa(eleccion) in (ETAPA_PUBLICADA, ETAPA_POSTULACION):
                return _fallo('El tarjetón se publica cuando cierra el periodo de postulación', 'prohibido')

            return {'success': True, 'candidatos': Candidato.listar_por_eleccion(id_eleccion) or []}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al listar candidatos: {e}")
            return _fallo(MSG_SISTEMA, 'error_sistema')

    # ---------- Admin / docente ----------

    def listar_para_gestion(self, id_eleccion, id_usuario):
        # Todas las candidaturas con su estado, en cualquier etapa
        try:
            if not obtener_eleccion_de_institucion(id_eleccion, id_usuario):
                return _fallo(MSG_ELECCION_NO_ENCONTRADA, 'no_encontrado')
            return {'success': True, 'candidatos': Candidato.listar_para_gestion(id_eleccion) or []}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al listar candidaturas para gestión: {e}")
            return _fallo(MSG_SISTEMA, 'error_sistema')

    def revisar_candidatura(self, id_candidato, id_usuario_revisor, id_estado, observaciones=None):
        """
        Aprobar o rechazar, solo hasta antes del inicio. El rechazo exige motivo.
        Se permite corregir de Rechazada a Aprobada. Las observaciones se
        conservan si no se manda un comentario nuevo.
        """
        try:
            if id_estado not in (ESTADO_APROBADA, ESTADO_RECHAZADA):
                return _fallo('Solo se puede aprobar o rechazar una candidatura')

            observaciones = (observaciones or '').strip()
            if id_estado == ESTADO_RECHAZADA and not observaciones:
                return _fallo('Debes indicar el motivo del rechazo')

            candidato, eleccion = self._candidatura_de_institucion(id_candidato, id_usuario_revisor)
            if not candidato:
                return _fallo(MSG_CANDIDATURA_NO_ENCONTRADA, 'no_encontrado')

            if calcular_etapa(eleccion) not in ETAPAS_SIN_INICIAR:
                return _fallo(MSG_ELECCION_INICIADA)

            estado_actual = candidato['id_estado_candidatura']
            if estado_actual == ESTADO_RETIRADA:
                return _fallo('La candidatura fue retirada por el candidato')
            if estado_actual == ESTADO_RETIRO_SOLICITADO:
                return _fallo('El candidato pidió retirarse: resuelve primero esa solicitud')
            if estado_actual == id_estado:
                return _fallo('La candidatura ya está en ese estado. Para dejar un comentario usa las observaciones', 'conflicto')

            if not Candidato.cambiar_estado(id_candidato, id_estado, observaciones or None):
                return _fallo('Error al actualizar la candidatura', 'error_sistema')

            accion = 'aprobada' if id_estado == ESTADO_APROBADA else 'rechazada'
            return {'success': True, 'message': f'Candidatura {accion} exitosamente'}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al revisar candidatura: {e}")
            return _fallo(MSG_SISTEMA, 'error_sistema')

    def actualizar_observaciones(self, id_candidato, id_usuario_revisor, observaciones):
        """Comentario informativo, sin cambiar el estado. Reemplaza al anterior; vacío lo borra."""
        try:
            candidato, eleccion = self._candidatura_de_institucion(id_candidato, id_usuario_revisor)
            if not candidato:
                return _fallo(MSG_CANDIDATURA_NO_ENCONTRADA, 'no_encontrado')

            if calcular_etapa(eleccion) not in ETAPAS_SIN_INICIAR:
                return _fallo(MSG_ELECCION_INICIADA)

            texto = (observaciones or '').strip() or None
            if not Candidato.actualizar_observaciones(id_candidato, texto):
                return _fallo('Error al guardar la observación', 'error_sistema')

            mensaje = 'Observación guardada' if texto else 'Observación eliminada'
            return {'success': True, 'message': mensaje}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al actualizar observaciones: {e}")
            return _fallo(MSG_SISTEMA, 'error_sistema')

    def resolver_retiro(self, id_candidato, id_usuario_revisor, aprobar):
        """Aprobar -> Retirada. Negar -> vuelve a Aprobada. Solo antes del inicio."""
        try:
            candidato, eleccion = self._candidatura_de_institucion(id_candidato, id_usuario_revisor)
            if not candidato:
                return _fallo(MSG_CANDIDATURA_NO_ENCONTRADA, 'no_encontrado')

            if calcular_etapa(eleccion) not in ETAPAS_SIN_INICIAR:
                return _fallo(MSG_ELECCION_INICIADA)

            if candidato['id_estado_candidatura'] != ESTADO_RETIRO_SOLICITADO:
                return _fallo('Esta candidatura no tiene un retiro pendiente')

            nuevo_estado = ESTADO_RETIRADA if aprobar else ESTADO_APROBADA
            if not Candidato.cambiar_estado(id_candidato, nuevo_estado):
                return _fallo('Error al resolver el retiro', 'error_sistema')

            mensaje = 'Retiro aprobado, la candidatura sale del tarjetón' if aprobar \
                else 'Retiro negado, la candidatura sigue aprobada'
            return {'success': True, 'message': mensaje}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al resolver retiro: {e}")
            return _fallo(MSG_SISTEMA, 'error_sistema')