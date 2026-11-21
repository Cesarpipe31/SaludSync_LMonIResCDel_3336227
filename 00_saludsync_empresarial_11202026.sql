-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 20-11-2026 a las 15:36:09
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `saludsync_empresarial`
--
CREATE DATABASE IF NOT EXISTS `saludsync_empresarial` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `saludsync_empresarial`;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `agenda_medica`
--

CREATE TABLE `agenda_medica` (
  `id_agenda` int(10) UNSIGNED NOT NULL,
  `id_profesional` int(10) UNSIGNED NOT NULL,
  `id_consultorio` int(10) UNSIGNED NOT NULL,
  `dia_semana` enum('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo') NOT NULL,
  `hora_inicio_turno` time NOT NULL,
  `hora_fin_turno` time NOT NULL,
  `duracion_cita_min` smallint(5) UNSIGNED NOT NULL,
  `permite_sobrecupo` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_inicio_vigencia` date NOT NULL,
  `fecha_fin_vigencia` date DEFAULT NULL,
  `estado` enum('Publicada','Borrador','Inactiva') NOT NULL DEFAULT 'Borrador'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `agenda_medica`
--

INSERT INTO `agenda_medica` (`id_agenda`, `id_profesional`, `id_consultorio`, `dia_semana`, `hora_inicio_turno`, `hora_fin_turno`, `duracion_cita_min`, `permite_sobrecupo`, `fecha_inicio_vigencia`, `fecha_fin_vigencia`, `estado`) VALUES
(1, 1, 1, 'Lunes', '08:00:00', '12:00:00', 20, 0, '2026-01-01', '2026-12-31', 'Publicada'),
(2, 2, 2, 'Lunes', '08:00:00', '12:00:00', 20, 0, '2026-01-01', '2026-12-31', 'Publicada'),
(3, 3, 3, 'Lunes', '08:00:00', '12:00:00', 20, 0, '2026-01-01', '2026-12-31', 'Publicada'),
(4, 4, 4, 'Lunes', '08:00:00', '12:00:00', 20, 0, '2026-01-01', '2026-12-31', 'Publicada'),
(5, 5, 5, 'Lunes', '08:00:00', '12:00:00', 20, 0, '2026-01-01', '2026-12-31', 'Publicada'),
(6, 6, 6, 'Lunes', '08:00:00', '12:00:00', 20, 0, '2026-01-01', '2026-12-31', 'Publicada'),
(7, 7, 7, 'Lunes', '08:00:00', '12:00:00', 20, 0, '2026-01-01', '2026-12-31', 'Publicada'),
(8, 8, 8, 'Lunes', '08:00:00', '12:00:00', 20, 0, '2026-01-01', '2026-12-31', 'Publicada'),
(9, 9, 9, 'Lunes', '08:00:00', '12:00:00', 20, 0, '2026-01-01', '2026-12-31', 'Publicada'),
(10, 10, 10, 'Lunes', '08:00:00', '12:00:00', 20, 0, '2026-01-01', '2026-12-31', 'Publicada'),
(11, 11, 11, 'Lunes', '08:00:00', '12:00:00', 20, 0, '2026-01-01', '2026-12-31', 'Publicada'),
(12, 12, 12, 'Lunes', '08:00:00', '12:00:00', 20, 0, '2026-01-01', '2026-12-31', 'Publicada');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `anexo_clinico`
--

CREATE TABLE `anexo_clinico` (
  `id_anexo` int(10) UNSIGNED NOT NULL,
  `id_historia` int(10) UNSIGNED NOT NULL,
  `id_atencion` int(10) UNSIGNED DEFAULT NULL,
  `id_usuario_sube` int(10) UNSIGNED NOT NULL,
  `nombre_archivo` varchar(150) NOT NULL,
  `ruta_archivo` varchar(255) NOT NULL,
  `tipo_archivo` enum('PDF','Imagen','Documento') NOT NULL,
  `fecha_subida` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `anexo_clinico`
--

INSERT INTO `anexo_clinico` (`id_anexo`, `id_historia`, `id_atencion`, `id_usuario_sube`, `nombre_archivo`, `ruta_archivo`, `tipo_archivo`, `fecha_subida`) VALUES
(1, 1, 1, 1, 'Doc_1.pdf', '/ruta/1', 'PDF', '2026-09-14 09:56:32'),
(2, 2, 2, 2, 'Doc_2.pdf', '/ruta/2', 'PDF', '2026-09-14 09:56:32'),
(3, 3, 3, 3, 'Doc_3.pdf', '/ruta/3', 'PDF', '2026-09-14 09:56:32'),
(4, 4, 4, 4, 'Doc_4.pdf', '/ruta/4', 'Imagen', '2026-09-14 09:56:32'),
(5, 5, 5, 5, 'Doc_5.pdf', '/ruta/5', 'Documento', '2026-09-14 09:56:32'),
(6, 6, 6, 6, 'Doc_6.pdf', '/ruta/6', 'PDF', '2026-09-14 09:56:32'),
(7, 7, 7, 7, 'Doc_7.pdf', '/ruta/7', 'PDF', '2026-09-14 09:56:32'),
(8, 8, 8, 8, 'Doc_8.pdf', '/ruta/8', 'Imagen', '2026-09-14 09:56:32'),
(9, 9, 9, 9, 'Doc_9.pdf', '/ruta/9', 'Documento', '2026-09-14 09:56:32'),
(10, 10, 10, 10, 'Doc_10.pdf', '/ruta/10', 'PDF', '2026-09-14 09:56:32'),
(11, 11, 11, 11, 'Doc_11.pdf', '/ruta/11', 'PDF', '2026-09-14 09:56:32'),
(12, 12, 12, 12, 'Doc_12.pdf', '/ruta/12', 'Imagen', '2026-09-14 09:56:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `antecedente_clinico`
--

CREATE TABLE `antecedente_clinico` (
  `id_antecedente` int(10) UNSIGNED NOT NULL,
  `id_paciente` int(10) UNSIGNED NOT NULL,
  `id_profesional` int(10) UNSIGNED NOT NULL,
  `id_atencion` int(10) UNSIGNED DEFAULT NULL,
  `tipo_antecedente` enum('Patológico','Quirúrgico','Farmacológico','Alérgico','Familiar') NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `antecedente_clinico`
--

INSERT INTO `antecedente_clinico` (`id_antecedente`, `id_paciente`, `id_profesional`, `id_atencion`, `tipo_antecedente`, `descripcion`, `fecha_registro`) VALUES
(1, 1, 1, 1, 'Patológico', 'Hipertensión', '2026-09-14 09:56:32'),
(2, 2, 2, 2, 'Alérgico', 'Penicilina', '2026-09-14 09:56:32'),
(3, 3, 3, 3, 'Quirúrgico', 'Apendicectomía', '2026-09-14 09:56:32'),
(4, 4, 4, 4, 'Familiar', 'Diabetes', '2026-09-14 09:56:32'),
(5, 5, 5, 5, 'Farmacológico', 'Losartán', '2026-09-14 09:56:32'),
(6, 6, 6, 6, 'Patológico', 'Asma', '2026-09-14 09:56:32'),
(7, 7, 7, 7, 'Alérgico', 'Ibuprofeno', '2026-09-14 09:56:32'),
(8, 8, 8, 8, 'Quirúrgico', 'Hernia', '2026-09-14 09:56:32'),
(9, 9, 9, 9, 'Familiar', 'Hipertensión', '2026-09-14 09:56:32'),
(10, 10, 10, 10, 'Patológico', 'Gastritis', '2026-09-14 09:56:32'),
(11, 11, 11, 11, 'Alérgico', 'Polvo', '2026-09-14 09:56:32'),
(12, 12, 12, 12, 'Quirúrgico', 'Amígdalas', '2026-09-14 09:56:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `atencion_medica`
--

CREATE TABLE `atencion_medica` (
  `id_atencion` int(10) UNSIGNED NOT NULL,
  `id_cita` int(10) UNSIGNED NOT NULL,
  `id_paciente` int(10) UNSIGNED NOT NULL,
  `id_profesional` int(10) UNSIGNED NOT NULL,
  `motivo_consulta` varchar(500) NOT NULL,
  `enfermedad_actual` text DEFAULT NULL,
  `revision_por_sistemas` text DEFAULT NULL,
  `examen_fisico` text DEFAULT NULL,
  `estado` enum('En Atención','Finalizada') NOT NULL DEFAULT 'En Atención',
  `fecha_hora_inicio` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_hora_fin` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `atencion_medica`
--

INSERT INTO `atencion_medica` (`id_atencion`, `id_cita`, `id_paciente`, `id_profesional`, `motivo_consulta`, `enfermedad_actual`, `revision_por_sistemas`, `examen_fisico`, `estado`, `fecha_hora_inicio`, `fecha_hora_fin`) VALUES
(1, 1, 1, 1, 'Cefalea', 'Cefalea', 'Normal', 'Normal', 'Finalizada', '2026-09-14 09:56:32', NULL),
(2, 2, 2, 2, 'Dolor', 'Dolor', 'Normal', 'Normal', 'Finalizada', '2026-09-14 09:56:32', NULL),
(3, 3, 3, 3, 'Control', 'Control', 'Normal', 'Normal', 'Finalizada', '2026-09-14 09:56:32', NULL),
(4, 4, 4, 4, 'Dolor', 'Dolor', 'Normal', 'Normal', 'Finalizada', '2026-09-14 09:56:32', NULL),
(5, 5, 5, 5, 'Fiebre', 'Fiebre', 'Normal', 'Normal', 'Finalizada', '2026-09-14 09:56:32', NULL),
(6, 6, 6, 6, 'Control', 'Control', 'Normal', 'Normal', 'Finalizada', '2026-09-14 09:56:32', NULL),
(7, 7, 7, 7, 'Cefalea', 'Cefalea', 'Normal', 'Normal', 'Finalizada', '2026-09-14 09:56:32', NULL),
(8, 8, 8, 8, 'Dolor', 'Dolor', 'Normal', 'Normal', 'Finalizada', '2026-09-14 09:56:32', NULL),
(9, 9, 9, 9, 'Fiebre', 'Fiebre', 'Normal', 'Normal', 'Finalizada', '2026-09-14 09:56:32', NULL),
(10, 10, 10, 10, 'Control', 'Control', 'Normal', 'Normal', 'Finalizada', '2026-09-14 09:56:32', NULL),
(11, 11, 11, 11, 'Cefalea', 'Cefalea', 'Normal', 'Normal', 'Finalizada', '2026-09-14 09:56:32', NULL),
(12, 12, 12, 12, 'Dolor', 'Dolor', 'Normal', 'Normal', 'Finalizada', '2026-09-14 09:56:32', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `auditoria_clinica`
--

CREATE TABLE `auditoria_clinica` (
  `id_auditoria` int(10) UNSIGNED NOT NULL,
  `id_usuario` int(10) UNSIGNED NOT NULL,
  `tabla_afectada` varchar(60) NOT NULL,
  `id_registro_afectado` int(10) UNSIGNED NOT NULL,
  `accion` enum('Apertura','Creación','Modificación','Cierre') NOT NULL,
  `estado_anterior` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`estado_anterior`)),
  `estado_nuevo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`estado_nuevo`)),
  `direccion_ip` varchar(45) DEFAULT NULL,
  `fecha_hora` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `auditoria_clinica`
--

INSERT INTO `auditoria_clinica` (`id_auditoria`, `id_usuario`, `tabla_afectada`, `id_registro_afectado`, `accion`, `estado_anterior`, `estado_nuevo`, `direccion_ip`, `fecha_hora`) VALUES
(1, 1, 'cita_medica', 1, 'Creación', NULL, NULL, '127.0.0.1', '2026-09-14 09:56:33'),
(2, 2, 'paciente', 2, 'Modificación', NULL, NULL, '192.168.1.2', '2026-09-14 09:56:33'),
(3, 3, 'historia_clinica', 3, 'Cierre', NULL, NULL, '10.0.0.3', '2026-09-14 09:56:33'),
(4, 4, 'usuario', 4, 'Creación', NULL, NULL, '172.16.0.4', '2026-09-14 09:56:33'),
(5, 5, 'cita_medica', 5, 'Modificación', NULL, NULL, '127.0.0.1', '2026-09-14 09:56:33'),
(6, 6, 'paciente', 6, 'Cierre', NULL, NULL, '192.168.1.6', '2026-09-14 09:56:33'),
(7, 7, 'historia_clinica', 7, 'Creación', NULL, NULL, '10.0.0.7', '2026-09-14 09:56:33'),
(8, 8, 'usuario', 8, 'Modificación', NULL, NULL, '172.16.0.8', '2026-09-14 09:56:33'),
(9, 9, 'cita_medica', 9, 'Cierre', NULL, NULL, '127.0.0.1', '2026-09-14 09:56:33'),
(10, 10, 'paciente', 10, 'Creación', NULL, NULL, '192.168.1.10', '2026-09-14 09:56:33'),
(11, 11, 'historia_clinica', 11, 'Modificación', NULL, NULL, '10.0.0.11', '2026-09-14 09:56:33'),
(12, 12, 'usuario', 12, 'Cierre', NULL, NULL, '172.16.0.12', '2026-09-14 09:56:33'),
(15, 13, 'usuario', 18, 'Creación', NULL, '{\"id_institucion\":13,\"id_rol\":2,\"correo_electronico\":\"admin1@prueba.co\"}', '::1', '2026-11-15 20:04:54'),
(17, 13, 'usuario', 19, 'Creación', NULL, '{\"id_institucion\":14,\"id_rol\":2,\"correo_electronico\":\"admin123@prueba.co\"}', '::1', '2026-11-15 20:07:03'),
(19, 13, 'usuario', 20, 'Creación', NULL, '{\"id_institucion\":15,\"id_rol\":2,\"correo_electronico\":\"admin1979797@prueba.co\"}', '::1', '2026-11-15 20:10:31'),
(30, 13, 'institucion', 16, 'Creación', NULL, '{\"razon_social\":\"IPS Prueba M1\",\"nit\":\"900555111-6\",\"codigo_reps\":\"681012550\",\"estado\":\"Activa\"}', '::1', '2026-11-16 07:56:15'),
(31, 13, 'usuario', 21, 'Creación', NULL, '{\"id_institucion\":16,\"id_rol\":2,\"correo_electronico\":\"admin@prueba.co\"}', '::1', '2026-11-16 07:56:15'),
(32, 13, 'institucion', 17, 'Creación', NULL, '{\"razon_social\":\"IPS Prueba M123\",\"nit\":\"9005551111-1\",\"codigo_reps\":\"6810125501\",\"estado\":\"Activa\"}', '::1', '2026-11-16 07:59:07'),
(33, 13, 'usuario', 22, 'Creación', NULL, '{\"id_institucion\":17,\"id_rol\":2,\"correo_electronico\":\"admin123@prueba.co\"}', '::1', '2026-11-16 07:59:07'),
(34, 23, 'usuario', 23, 'Creación', NULL, '{\"id_institucion\":1,\"id_rol\":5,\"correo_electronico\":\"pac.m2b@mail.com\",\"origen\":\"autorregistro\"}', '::1', '2026-11-17 22:21:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bloqueo_agenda`
--

CREATE TABLE `bloqueo_agenda` (
  `id_bloqueo` int(10) UNSIGNED NOT NULL,
  `id_profesional` int(10) UNSIGNED NOT NULL,
  `fecha_hora_inicio` datetime NOT NULL,
  `fecha_hora_fin` datetime NOT NULL,
  `motivo` enum('Permiso','Vacaciones','Incapacidad','Reunión Médica') NOT NULL,
  `observaciones` varchar(255) DEFAULT NULL,
  `estado` enum('Programado','Activo','Finalizado') NOT NULL DEFAULT 'Programado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `bloqueo_agenda`
--

INSERT INTO `bloqueo_agenda` (`id_bloqueo`, `id_profesional`, `fecha_hora_inicio`, `fecha_hora_fin`, `motivo`, `observaciones`, `estado`) VALUES
(1, 1, '2026-05-01 08:00:00', '2026-05-01 12:00:00', 'Vacaciones', 'Desc', 'Programado'),
(2, 2, '2026-05-01 08:00:00', '2026-05-01 12:00:00', 'Permiso', 'Desc', 'Programado'),
(3, 3, '2026-05-01 08:00:00', '2026-05-01 12:00:00', 'Incapacidad', 'Desc', 'Programado'),
(4, 4, '2026-05-01 08:00:00', '2026-05-01 12:00:00', 'Reunión Médica', 'Desc', 'Programado'),
(5, 5, '2026-05-01 08:00:00', '2026-05-01 12:00:00', 'Vacaciones', 'Desc', 'Programado'),
(6, 6, '2026-05-01 08:00:00', '2026-05-01 12:00:00', 'Permiso', 'Desc', 'Programado'),
(7, 7, '2026-05-01 08:00:00', '2026-05-01 12:00:00', 'Incapacidad', 'Desc', 'Programado'),
(8, 8, '2026-05-01 08:00:00', '2026-05-01 12:00:00', 'Reunión Médica', 'Desc', 'Programado'),
(9, 9, '2026-05-01 08:00:00', '2026-05-01 12:00:00', 'Vacaciones', 'Desc', 'Programado'),
(10, 10, '2026-05-01 08:00:00', '2026-05-01 12:00:00', 'Permiso', 'Desc', 'Programado'),
(11, 11, '2026-05-01 08:00:00', '2026-05-01 12:00:00', 'Incapacidad', 'Desc', 'Programado'),
(12, 12, '2026-05-01 08:00:00', '2026-05-01 12:00:00', 'Reunión Médica', 'Desc', 'Programado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `catalogo_cie10`
--

CREATE TABLE `catalogo_cie10` (
  `codigo_cie10` varchar(10) NOT NULL,
  `descripcion_patologia` varchar(200) NOT NULL,
  `categoria` varchar(80) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `catalogo_cie10`
--

INSERT INTO `catalogo_cie10` (`codigo_cie10`, `descripcion_patologia`, `categoria`) VALUES
('A09', 'Diarrea infecciosa', 'Infecciosa'),
('E11', 'Diabetes mellitus tipo 2', 'Endocrina'),
('F32', 'Episodio depresivo', 'Mental'),
('H52', 'Astigmatismo', 'Ocular'),
('I10', 'Hipertensión esencial', 'Circulatorio'),
('J00', 'Rinofaringitis aguda', 'Respiratorio'),
('J45', 'Asma', 'Respiratorio'),
('K02.1', 'Caries de la dentina', 'Digestivo'),
('K21', 'Reflujo gastroesofágico', 'Digestivo'),
('L70', 'Acné', 'Piel'),
('M54', 'Dorsalgia', 'Musculoesqueletico'),
('N39', 'Infección Urinaria', 'Genitourinario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cita_medica`
--

CREATE TABLE `cita_medica` (
  `id_cita` int(10) UNSIGNED NOT NULL,
  `id_institucion` int(10) UNSIGNED NOT NULL,
  `id_paciente` int(10) UNSIGNED NOT NULL,
  `id_profesional` int(10) UNSIGNED NOT NULL,
  `id_consultorio` int(10) UNSIGNED NOT NULL,
  `fecha_cita` date NOT NULL,
  `hora_cita` time NOT NULL,
  `tipo_consulta` enum('Primera vez','Control','Valoración') NOT NULL,
  `estado` enum('Programada','En Sala de Espera','En Consulta','Atendida','Cancelada','Inasistencia') NOT NULL DEFAULT 'Programada',
  `motivo_cancelacion` varchar(150) DEFAULT NULL,
  `fecha_hora_checkin` datetime DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `cupo_activo` tinyint(1) GENERATED ALWAYS AS (case when `estado` in ('Cancelada','Inasistencia') then NULL else 1 end) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `cita_medica`
--

INSERT INTO `cita_medica` (`id_cita`, `id_institucion`, `id_paciente`, `id_profesional`, `id_consultorio`, `fecha_cita`, `hora_cita`, `tipo_consulta`, `estado`, `motivo_cancelacion`, `fecha_hora_checkin`, `fecha_creacion`) VALUES
(1, 1, 1, 1, 1, '2026-09-11', '08:00:00', 'Primera vez', 'Atendida', NULL, NULL, '2026-09-14 09:56:32'),
(2, 2, 2, 2, 2, '2026-09-12', '08:00:00', 'Control', 'Atendida', NULL, NULL, '2026-09-14 09:56:32'),
(3, 3, 3, 3, 3, '2026-09-13', '08:00:00', 'Valoración', 'Atendida', NULL, NULL, '2026-09-14 09:56:32'),
(4, 4, 4, 4, 4, '2026-09-14', '08:00:00', 'Primera vez', 'Atendida', NULL, NULL, '2026-09-14 09:56:32'),
(5, 5, 5, 5, 5, '2026-09-15', '08:00:00', 'Control', 'Atendida', NULL, NULL, '2026-09-14 09:56:32'),
(6, 6, 6, 6, 6, '2026-09-16', '08:00:00', 'Valoración', 'Atendida', NULL, NULL, '2026-09-14 09:56:32'),
(7, 7, 7, 7, 7, '2026-09-17', '08:00:00', 'Primera vez', 'Atendida', NULL, NULL, '2026-09-14 09:56:32'),
(8, 8, 8, 8, 8, '2026-09-18', '08:00:00', 'Control', 'Atendida', NULL, NULL, '2026-09-14 09:56:32'),
(9, 9, 9, 9, 9, '2026-09-19', '08:00:00', 'Valoración', 'Atendida', NULL, NULL, '2026-09-14 09:56:32'),
(10, 10, 10, 10, 10, '2026-09-20', '08:00:00', 'Primera vez', 'Atendida', NULL, NULL, '2026-09-14 09:56:32'),
(11, 11, 11, 11, 11, '2026-09-21', '08:00:00', 'Control', 'Atendida', NULL, NULL, '2026-09-14 09:56:32'),
(12, 12, 12, 12, 12, '2026-09-22', '08:00:00', 'Valoración', 'Atendida', NULL, NULL, '2026-09-14 09:56:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion_alerta`
--

CREATE TABLE `configuracion_alerta` (
  `id_configuracion` int(10) UNSIGNED NOT NULL,
  `id_institucion` int(10) UNSIGNED NOT NULL,
  `evento` varchar(60) NOT NULL,
  `anticipacion_horas` smallint(5) UNSIGNED DEFAULT NULL,
  `plantilla_mensaje` text NOT NULL,
  `estado` enum('Activa','Inactiva') NOT NULL DEFAULT 'Activa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `configuracion_alerta`
--

INSERT INTO `configuracion_alerta` (`id_configuracion`, `id_institucion`, `evento`, `anticipacion_horas`, `plantilla_mensaje`, `estado`) VALUES
(1, 1, 'Recordatorio Cita', 24, 'Hola, tienes cita mañana', 'Activa'),
(2, 2, 'Recordatorio Cita', 24, 'Hola, tienes cita mañana', 'Activa'),
(3, 3, 'Recordatorio Cita', 24, 'Hola, tienes cita mañana', 'Activa'),
(4, 4, 'Recordatorio Cita', 24, 'Hola, tienes cita mañana', 'Activa'),
(5, 5, 'Recordatorio Cita', 24, 'Hola, tienes cita mañana', 'Activa'),
(6, 6, 'Recordatorio Cita', 24, 'Hola, tienes cita mañana', 'Activa'),
(7, 7, 'Recordatorio Cita', 24, 'Hola, tienes cita mañana', 'Activa'),
(8, 8, 'Recordatorio Cita', 24, 'Hola, tienes cita mañana', 'Activa'),
(9, 9, 'Recordatorio Cita', 24, 'Hola, tienes cita mañana', 'Activa'),
(10, 10, 'Recordatorio Cita', 24, 'Hola, tienes cita mañana', 'Activa'),
(11, 11, 'Recordatorio Cita', 24, 'Hola, tienes cita mañana', 'Activa'),
(12, 12, 'Recordatorio Cita', 24, 'Hola, tienes cita mañana', 'Activa');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion_alerta_canal`
--

CREATE TABLE `configuracion_alerta_canal` (
  `id_configuracion` int(10) UNSIGNED NOT NULL,
  `canal` enum('Web','Correo Electrónico','SMS') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `configuracion_alerta_canal`
--

INSERT INTO `configuracion_alerta_canal` (`id_configuracion`, `canal`) VALUES
(1, 'Correo Electrónico'),
(2, 'SMS'),
(3, 'Web'),
(4, 'Correo Electrónico'),
(5, 'SMS'),
(6, 'Web'),
(7, 'Correo Electrónico'),
(8, 'SMS'),
(9, 'Web'),
(10, 'Correo Electrónico'),
(11, 'SMS'),
(12, 'Web');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `consultorio`
--

CREATE TABLE `consultorio` (
  `id_consultorio` int(10) UNSIGNED NOT NULL,
  `id_sede` int(10) UNSIGNED NOT NULL,
  `codigo_consultorio` varchar(15) NOT NULL,
  `nombre_consultorio` varchar(60) NOT NULL,
  `tipo_consultorio` enum('Consulta Externa','Procedimientos','Odontología') NOT NULL,
  `piso_bloque` varchar(30) DEFAULT NULL,
  `estado` enum('Habilitado','En Mantenimiento','Inactivo') NOT NULL DEFAULT 'Habilitado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `consultorio`
--

INSERT INTO `consultorio` (`id_consultorio`, `id_sede`, `codigo_consultorio`, `nombre_consultorio`, `tipo_consultorio`, `piso_bloque`, `estado`) VALUES
(1, 1, 'C1', 'Cons 1', 'Consulta Externa', 'Piso 1', 'Habilitado'),
(2, 2, 'C2', 'Cons 2', 'Consulta Externa', 'Piso 1', 'Habilitado'),
(3, 3, 'C3', 'Cons 3', 'Consulta Externa', 'Piso 1', 'Habilitado'),
(4, 4, 'C4', 'Cons 4', 'Consulta Externa', 'Piso 1', 'Habilitado'),
(5, 5, 'C5', 'Cons 5', 'Consulta Externa', 'Piso 1', 'Habilitado'),
(6, 6, 'C6', 'Cons 6', 'Consulta Externa', 'Piso 1', 'Habilitado'),
(7, 7, 'C7', 'Cons 7', 'Consulta Externa', 'Piso 1', 'Habilitado'),
(8, 8, 'C8', 'Cons 8', 'Consulta Externa', 'Piso 1', 'Habilitado'),
(9, 9, 'C9', 'Cons 9', 'Consulta Externa', 'Piso 1', 'Habilitado'),
(10, 10, 'C10', 'Cons 10', 'Consulta Externa', 'Piso 1', 'Habilitado'),
(11, 11, 'C11', 'Cons 11', 'Consulta Externa', 'Piso 1', 'Habilitado'),
(12, 12, 'C12', 'Cons 12', 'Consulta Externa', 'Piso 1', 'Habilitado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `diagnostico`
--

CREATE TABLE `diagnostico` (
  `id_diagnostico` int(10) UNSIGNED NOT NULL,
  `id_atencion` int(10) UNSIGNED NOT NULL,
  `codigo_cie10` varchar(10) NOT NULL,
  `tipo_diagnostico` enum('Principal','Relacionado 1','Relacionado 2','Descarte') NOT NULL,
  `tipo_confirmacion` enum('Impresión Diagnóstica','Confirmado Nuevo','Confirmado Repetido') NOT NULL,
  `observaciones` text DEFAULT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `diagnostico`
--

INSERT INTO `diagnostico` (`id_diagnostico`, `id_atencion`, `codigo_cie10`, `tipo_diagnostico`, `tipo_confirmacion`, `observaciones`, `fecha_registro`) VALUES
(1, 1, 'E11', 'Principal', 'Confirmado Nuevo', NULL, '2026-09-14 09:56:32'),
(2, 2, 'I10', 'Principal', 'Confirmado Repetido', NULL, '2026-09-14 09:56:32'),
(3, 3, 'J00', 'Principal', 'Impresión Diagnóstica', NULL, '2026-09-14 09:56:32'),
(4, 4, 'K02.1', 'Principal', 'Confirmado Nuevo', NULL, '2026-09-14 09:56:32'),
(5, 5, 'A09', 'Principal', 'Impresión Diagnóstica', NULL, '2026-09-14 09:56:32'),
(6, 6, 'M54', 'Principal', 'Confirmado Repetido', NULL, '2026-09-14 09:56:32'),
(7, 7, 'F32', 'Principal', 'Confirmado Nuevo', NULL, '2026-09-14 09:56:32'),
(8, 8, 'J45', 'Principal', 'Confirmado Repetido', NULL, '2026-09-14 09:56:32'),
(9, 9, 'K21', 'Principal', 'Impresión Diagnóstica', NULL, '2026-09-14 09:56:32'),
(10, 10, 'N39', 'Principal', 'Confirmado Nuevo', NULL, '2026-09-14 09:56:32'),
(11, 11, 'L70', 'Principal', 'Confirmado Repetido', NULL, '2026-09-14 09:56:32'),
(12, 12, 'H52', 'Principal', 'Impresión Diagnóstica', NULL, '2026-09-14 09:56:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `disponibilidad_consultorio`
--

CREATE TABLE `disponibilidad_consultorio` (
  `id_disponibilidad` int(10) UNSIGNED NOT NULL,
  `id_consultorio` int(10) UNSIGNED NOT NULL,
  `dia_semana` enum('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo') NOT NULL,
  `hora_apertura` time NOT NULL,
  `hora_cierre` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `disponibilidad_consultorio`
--

INSERT INTO `disponibilidad_consultorio` (`id_disponibilidad`, `id_consultorio`, `dia_semana`, `hora_apertura`, `hora_cierre`) VALUES
(1, 1, 'Lunes', '08:00:00', '18:00:00'),
(2, 2, 'Martes', '08:00:00', '18:00:00'),
(3, 3, 'Miércoles', '08:00:00', '18:00:00'),
(4, 4, 'Jueves', '08:00:00', '18:00:00'),
(5, 5, 'Viernes', '08:00:00', '18:00:00'),
(6, 6, 'Sábado', '08:00:00', '12:00:00'),
(7, 7, 'Lunes', '08:00:00', '18:00:00'),
(8, 8, 'Martes', '08:00:00', '18:00:00'),
(9, 9, 'Miércoles', '08:00:00', '18:00:00'),
(10, 10, 'Jueves', '08:00:00', '18:00:00'),
(11, 11, 'Viernes', '08:00:00', '18:00:00'),
(12, 12, 'Sábado', '08:00:00', '12:00:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `especialidad`
--

CREATE TABLE `especialidad` (
  `id_especialidad` int(10) UNSIGNED NOT NULL,
  `id_institucion` int(10) UNSIGNED NOT NULL,
  `codigo_especialidad` varchar(15) NOT NULL,
  `nombre_especialidad` varchar(60) NOT NULL,
  `descripcion_servicio` varchar(255) DEFAULT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL DEFAULT 'Activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `especialidad`
--

INSERT INTO `especialidad` (`id_especialidad`, `id_institucion`, `codigo_especialidad`, `nombre_especialidad`, `descripcion_servicio`, `estado`) VALUES
(1, 1, 'ESP-1', 'Especialidad 1', 'Desc', 'Activo'),
(2, 2, 'ESP-2', 'Especialidad 2', 'Desc', 'Activo'),
(3, 3, 'ESP-3', 'Especialidad 3', 'Desc', 'Activo'),
(4, 4, 'ESP-4', 'Especialidad 4', 'Desc', 'Activo'),
(5, 5, 'ESP-5', 'Especialidad 5', 'Desc', 'Activo'),
(6, 6, 'ESP-6', 'Especialidad 6', 'Desc', 'Activo'),
(7, 7, 'ESP-7', 'Especialidad 7', 'Desc', 'Activo'),
(8, 8, 'ESP-8', 'Especialidad 8', 'Desc', 'Activo'),
(9, 9, 'ESP-9', 'Especialidad 9', 'Desc', 'Activo'),
(10, 10, 'ESP-10', 'Especialidad 10', 'Desc', 'Activo'),
(11, 11, 'ESP-11', 'Especialidad 11', 'Desc', 'Activo'),
(12, 12, 'ESP-12', 'Especialidad 12', 'Desc', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `factura_saas`
--

CREATE TABLE `factura_saas` (
  `id_factura` int(10) UNSIGNED NOT NULL,
  `id_suscripcion` int(10) UNSIGNED NOT NULL,
  `numero_factura` varchar(30) NOT NULL,
  `fecha_emision` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `impuestos` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `estado_pago` enum('Pendiente','Pagada','Mora','Anulada') NOT NULL DEFAULT 'Pendiente',
  `fecha_pago` date DEFAULT NULL,
  `metodo_pago` enum('Transferencia','Tarjeta de Crédito','PSE','Otro') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `factura_saas`
--

INSERT INTO `factura_saas` (`id_factura`, `id_suscripcion`, `numero_factura`, `fecha_emision`, `fecha_vencimiento`, `subtotal`, `impuestos`, `total`, `estado_pago`, `fecha_pago`, `metodo_pago`) VALUES
(1, 1, 'FAC-1', '2026-01-01', '2026-01-15', 100000.00, 19000.00, 119000.00, 'Pagada', '2026-01-05', 'PSE'),
(2, 2, 'FAC-2', '2026-01-01', '2026-01-15', 100000.00, 19000.00, 119000.00, 'Pagada', '2026-01-05', 'PSE'),
(3, 3, 'FAC-3', '2026-01-01', '2026-01-15', 100000.00, 19000.00, 119000.00, 'Pagada', '2026-01-05', 'PSE'),
(4, 4, 'FAC-4', '2026-01-01', '2026-01-15', 100000.00, 19000.00, 119000.00, 'Pagada', '2026-01-05', 'PSE'),
(5, 5, 'FAC-5', '2026-01-01', '2026-01-15', 100000.00, 19000.00, 119000.00, 'Pagada', '2026-01-05', 'PSE'),
(6, 6, 'FAC-6', '2026-01-01', '2026-01-15', 100000.00, 19000.00, 119000.00, 'Pagada', '2026-01-05', 'PSE'),
(7, 7, 'FAC-7', '2026-01-01', '2026-01-15', 100000.00, 19000.00, 119000.00, 'Pagada', '2026-01-05', 'PSE'),
(8, 8, 'FAC-8', '2026-01-01', '2026-01-15', 100000.00, 19000.00, 119000.00, 'Pagada', '2026-01-05', 'PSE'),
(9, 9, 'FAC-9', '2026-01-01', '2026-01-15', 100000.00, 19000.00, 119000.00, 'Pagada', '2026-01-05', 'PSE'),
(10, 10, 'FAC-10', '2026-01-01', '2026-01-15', 100000.00, 19000.00, 119000.00, 'Pagada', '2026-01-05', 'PSE'),
(11, 11, 'FAC-11', '2026-01-01', '2026-01-15', 100000.00, 19000.00, 119000.00, 'Pagada', '2026-01-05', 'PSE'),
(12, 12, 'FAC-12', '2026-01-01', '2026-01-15', 100000.00, 19000.00, 119000.00, 'Pagada', '2026-01-05', 'PSE');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_reprogramacion`
--

CREATE TABLE `historial_reprogramacion` (
  `id_historial` int(10) UNSIGNED NOT NULL,
  `id_cita` int(10) UNSIGNED NOT NULL,
  `fecha_anterior` datetime NOT NULL,
  `fecha_nueva` datetime NOT NULL,
  `id_usuario_responsable` int(10) UNSIGNED NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `historial_reprogramacion`
--

INSERT INTO `historial_reprogramacion` (`id_historial`, `id_cita`, `fecha_anterior`, `fecha_nueva`, `id_usuario_responsable`, `fecha_registro`) VALUES
(1, 1, '2026-09-01 08:00:00', '2026-09-11 08:00:00', 1, '2026-09-14 09:56:32'),
(2, 2, '2026-09-02 08:00:00', '2026-09-12 08:00:00', 2, '2026-09-14 09:56:32'),
(3, 3, '2026-09-03 08:00:00', '2026-09-13 08:00:00', 3, '2026-09-14 09:56:32'),
(4, 4, '2026-09-04 08:00:00', '2026-09-14 08:00:00', 4, '2026-09-14 09:56:32'),
(5, 5, '2026-09-05 08:00:00', '2026-09-15 08:00:00', 5, '2026-09-14 09:56:32'),
(6, 6, '2026-09-06 08:00:00', '2026-09-16 08:00:00', 6, '2026-09-14 09:56:32'),
(7, 7, '2026-09-07 08:00:00', '2026-09-17 08:00:00', 7, '2026-09-14 09:56:32'),
(8, 8, '2026-09-08 08:00:00', '2026-09-18 08:00:00', 8, '2026-09-14 09:56:32'),
(9, 9, '2026-09-09 08:00:00', '2026-09-19 08:00:00', 9, '2026-09-14 09:56:32'),
(10, 10, '2026-09-10 08:00:00', '2026-09-20 08:00:00', 10, '2026-09-14 09:56:32'),
(11, 11, '2026-09-11 08:00:00', '2026-09-21 08:00:00', 11, '2026-09-14 09:56:32'),
(12, 12, '2026-09-12 08:00:00', '2026-09-22 08:00:00', 12, '2026-09-14 09:56:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historia_clinica`
--

CREATE TABLE `historia_clinica` (
  `id_historia` int(10) UNSIGNED NOT NULL,
  `id_paciente` int(10) UNSIGNED NOT NULL,
  `id_institucion` int(10) UNSIGNED NOT NULL,
  `fecha_apertura` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` enum('Activa','Cerrada') NOT NULL DEFAULT 'Activa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `historia_clinica`
--

INSERT INTO `historia_clinica` (`id_historia`, `id_paciente`, `id_institucion`, `fecha_apertura`, `estado`) VALUES
(1, 1, 1, '2026-09-14 09:56:32', 'Activa'),
(2, 2, 2, '2026-09-14 09:56:32', 'Activa'),
(3, 3, 3, '2026-09-14 09:56:32', 'Activa'),
(4, 4, 4, '2026-09-14 09:56:32', 'Activa'),
(5, 5, 5, '2026-09-14 09:56:32', 'Activa'),
(6, 6, 6, '2026-09-14 09:56:32', 'Activa'),
(7, 7, 7, '2026-09-14 09:56:32', 'Activa'),
(8, 8, 8, '2026-09-14 09:56:32', 'Activa'),
(9, 9, 9, '2026-09-14 09:56:32', 'Activa'),
(10, 10, 10, '2026-09-14 09:56:32', 'Activa'),
(11, 11, 11, '2026-09-14 09:56:32', 'Activa'),
(12, 12, 12, '2026-09-14 09:56:32', 'Activa');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `institucion`
--

CREATE TABLE `institucion` (
  `id_institucion` int(10) UNSIGNED NOT NULL,
  `razon_social` varchar(150) NOT NULL,
  `nit` varchar(20) NOT NULL,
  `codigo_reps` varchar(30) NOT NULL,
  `representante_legal_nombre` varchar(100) DEFAULT NULL,
  `representante_legal_documento` varchar(20) DEFAULT NULL,
  `departamento` varchar(60) NOT NULL,
  `ciudad` varchar(60) NOT NULL,
  `direccion` varchar(150) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo_contacto` varchar(100) NOT NULL,
  `estado` enum('Activa','Inactiva') NOT NULL DEFAULT 'Activa',
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `institucion`
--

INSERT INTO `institucion` (`id_institucion`, `razon_social`, `nit`, `codigo_reps`, `representante_legal_nombre`, `representante_legal_documento`, `departamento`, `ciudad`, `direccion`, `telefono`, `correo_contacto`, `estado`, `fecha_registro`) VALUES
(1, 'Clinica_1', '900111221-1', '680010000001', 'Rep_1', 'CC1123', 'Santander', 'Ciudad', 'Calle 1', '1234567', 'c1@mail.com', 'Activa', '2026-09-14 09:56:31'),
(2, 'Clinica_2', '900111222-1', '680010000002', 'Rep_2', 'CC2123', 'Santander', 'Ciudad', 'Calle 2', '1234567', 'c2@mail.com', 'Activa', '2026-09-14 09:56:31'),
(3, 'Clinica_3', '900111223-1', '680010000003', 'Rep_3', 'CC3123', 'Santander', 'Ciudad', 'Calle 3', '1234567', 'c3@mail.com', 'Activa', '2026-09-14 09:56:31'),
(4, 'Clinica_4', '900111224-1', '680010000004', 'Rep_4', 'CC4123', 'Santander', 'Ciudad', 'Calle 4', '1234567', 'c4@mail.com', 'Activa', '2026-09-14 09:56:31'),
(5, 'Clinica_5', '900111225-1', '680010000005', 'Rep_5', 'CC5123', 'Santander', 'Ciudad', 'Calle 5', '1234567', 'c5@mail.com', 'Activa', '2026-09-14 09:56:31'),
(6, 'Clinica_6', '900111226-1', '680010000006', 'Rep_6', 'CC6123', 'Santander', 'Ciudad', 'Calle 6', '1234567', 'c6@mail.com', 'Activa', '2026-09-14 09:56:31'),
(7, 'Clinica_7', '900111227-1', '680010000007', 'Rep_7', 'CC7123', 'Santander', 'Ciudad', 'Calle 7', '1234567', 'c7@mail.com', 'Activa', '2026-09-14 09:56:31'),
(8, 'Clinica_8', '900111228-1', '680010000008', 'Rep_8', 'CC8123', 'Santander', 'Ciudad', 'Calle 8', '1234567', 'c8@mail.com', 'Activa', '2026-09-14 09:56:31'),
(9, 'Clinica_9', '900111229-1', '680010000009', 'Rep_9', 'CC9123', 'Santander', 'Ciudad', 'Calle 9', '1234567', 'c9@mail.com', 'Activa', '2026-09-14 09:56:31'),
(10, 'Clinica_10', '9001112210-1', '680010000010', 'Rep_10', 'CC10123', 'Santander', 'Ciudad', 'Calle 10', '1234567', 'c10@mail.com', 'Activa', '2026-09-14 09:56:31'),
(11, 'Clinica_11', '9001112211-1', '680010000011', 'Rep_11', 'CC11123', 'Santander', 'Ciudad', 'Calle 11', '1234567', 'c11@mail.com', 'Activa', '2026-09-14 09:56:31'),
(12, 'Clinica_12', '9001112212-1', '680010000012', 'Rep_12', 'CC12123', 'Santander', 'Ciudad', 'Calle 12', '1234567', 'c12@mail.com', 'Activa', '2026-09-14 09:56:31'),
(15, 'IPS Prueba M123888', '8888888888-3', 'REPS-P1-0003', 'Ana Prueba123', '99999999', 'Norte de Santander', 'Cúcuta', 'Calle 1 # 2 - 3', '6071234567', 'legal777@prueba.co', 'Activa', '2026-11-15 20:10:31'),
(16, 'IPS Prueba M1', '900555111-6', '681012550', 'Ana Prueba', '52123456', 'Santander', 'Bucaramanga', 'Carrera 6b 14 25', '013174425006', 'cesarpipe31@gmail.com', 'Activa', '2026-11-16 07:56:15'),
(17, 'IPS Prueba M123', '9005551111-1', '6810125501', 'Ana Prueba', '5212345612', 'Santander', 'Bucaramanga', 'Carrera 6b 14 25', '013174425006', 'cesarpipe31@gmail.com', 'Activa', '2026-11-16 07:59:07');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medicamento_formulado`
--

CREATE TABLE `medicamento_formulado` (
  `id_item_formula` int(10) UNSIGNED NOT NULL,
  `id_tratamiento` int(10) UNSIGNED NOT NULL,
  `principio_activo` varchar(100) NOT NULL,
  `presentacion_concentracion` varchar(60) NOT NULL,
  `via_administracion` enum('Oral','Tópica','Intramuscular','Intravenosa','Otra') NOT NULL,
  `dosis` varchar(30) NOT NULL,
  `frecuencia` varchar(30) NOT NULL,
  `duracion_dias` smallint(5) UNSIGNED NOT NULL,
  `cantidad_total_dispensar` smallint(5) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `medicamento_formulado`
--

INSERT INTO `medicamento_formulado` (`id_item_formula`, `id_tratamiento`, `principio_activo`, `presentacion_concentracion`, `via_administracion`, `dosis`, `frecuencia`, `duracion_dias`, `cantidad_total_dispensar`) VALUES
(1, 1, 'Acetaminofén', '500mg', 'Oral', '1 Tab', '8h', 5, 15),
(2, 2, 'Ibuprofeno', '400mg', 'Oral', '1 Tab', '8h', 3, 9),
(3, 3, 'Amoxicilina', '500mg', 'Oral', '1 Cap', '8h', 7, 21),
(4, 4, 'Losartán', '50mg', 'Oral', '1 Tab', '24h', 30, 30),
(5, 5, 'Metformina', '850mg', 'Oral', '1 Tab', '12h', 30, 60),
(6, 6, 'Diclofenaco', '75mg', 'Intramuscular', '1 Amp', '12h', 2, 4),
(7, 7, 'Omeprazol', '20mg', 'Oral', '1 Cap', '24h', 14, 14),
(8, 8, 'Salbutamol', '100mcg', 'Oral', '2 Puff', '6h', 15, 1),
(9, 9, 'Loratadina', '10mg', 'Oral', '1 Tab', '24h', 10, 10),
(10, 10, 'Ciprofloxacino', '500mg', 'Oral', '1 Tab', '12h', 7, 14),
(11, 11, 'Clotrimazol', '1%', 'Tópica', 'Aplicar', '12h', 10, 1),
(12, 12, 'Naproxeno', '250mg', 'Oral', '1 Tab', '12h', 5, 10);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `meta_clinica`
--

CREATE TABLE `meta_clinica` (
  `id_meta` int(10) UNSIGNED NOT NULL,
  `id_seguimiento` int(10) UNSIGNED NOT NULL,
  `parametro` varchar(80) NOT NULL,
  `valor_objetivo` varchar(60) NOT NULL,
  `examen_requerido` varchar(80) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `meta_clinica`
--

INSERT INTO `meta_clinica` (`id_meta`, `id_seguimiento`, `parametro`, `valor_objetivo`, `examen_requerido`) VALUES
(1, 1, 'PA', '<130/80', 'Glicemia'),
(2, 2, 'Peso', '<80kg', 'N/A'),
(3, 3, 'Colesterol', '<200', 'Perfil Lipídico'),
(4, 4, 'Triglicéridos', '<150', 'Perfil Lipídico'),
(5, 5, 'HbA1c', '<7%', 'HbA1c'),
(6, 6, 'TSH', '0.4-4.0', 'TSH'),
(7, 7, 'Creatinina', '<1.2', 'Creatinina'),
(8, 8, 'Ácido Úrico', '<6.0', 'Ácido Úrico'),
(9, 9, 'Hemoglobina', '>12', 'Hemograma'),
(10, 10, 'Plaquetas', '>150000', 'Hemograma'),
(11, 11, 'Potasio', '3.5-5.0', 'Ionograma'),
(12, 12, 'Sodio', '135-145', 'Ionograma');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `nota_evolucion`
--

CREATE TABLE `nota_evolucion` (
  `id_nota` int(10) UNSIGNED NOT NULL,
  `id_historia` int(10) UNSIGNED NOT NULL,
  `id_atencion` int(10) UNSIGNED NOT NULL,
  `id_profesional` int(10) UNSIGNED NOT NULL,
  `tipo_nota` enum('SOAP','Narrativa') NOT NULL DEFAULT 'SOAP',
  `subjetivo` text DEFAULT NULL,
  `objetivo` text DEFAULT NULL,
  `analisis` text NOT NULL,
  `plan_manejo` text NOT NULL,
  `firma_digital` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `nota_evolucion`
--

INSERT INTO `nota_evolucion` (`id_nota`, `id_historia`, `id_atencion`, `id_profesional`, `tipo_nota`, `subjetivo`, `objetivo`, `analisis`, `plan_manejo`, `firma_digital`, `fecha_registro`) VALUES
(1, 1, 1, 1, 'SOAP', 'Subjetivo', 'Objetivo', 'Análisis', 'Plan', 1, '2026-09-14 09:56:32'),
(2, 2, 2, 2, 'SOAP', 'Subjetivo', 'Objetivo', 'Análisis', 'Plan', 1, '2026-09-14 09:56:32'),
(3, 3, 3, 3, 'SOAP', 'Subjetivo', 'Objetivo', 'Análisis', 'Plan', 1, '2026-09-14 09:56:32'),
(4, 4, 4, 4, 'Narrativa', 'N/A', 'N/A', 'Análisis', 'Plan', 1, '2026-09-14 09:56:32'),
(5, 5, 5, 5, 'SOAP', 'Subjetivo', 'Objetivo', 'Análisis', 'Plan', 1, '2026-09-14 09:56:32'),
(6, 6, 6, 6, 'SOAP', 'Subjetivo', 'Objetivo', 'Análisis', 'Plan', 1, '2026-09-14 09:56:32'),
(7, 7, 7, 7, 'SOAP', 'Subjetivo', 'Objetivo', 'Análisis', 'Plan', 1, '2026-09-14 09:56:32'),
(8, 8, 8, 8, 'Narrativa', 'N/A', 'N/A', 'Análisis', 'Plan', 1, '2026-09-14 09:56:32'),
(9, 9, 9, 9, 'SOAP', 'Subjetivo', 'Objetivo', 'Análisis', 'Plan', 1, '2026-09-14 09:56:32'),
(10, 10, 10, 10, 'SOAP', 'Subjetivo', 'Objetivo', 'Análisis', 'Plan', 1, '2026-09-14 09:56:32'),
(11, 11, 11, 11, 'SOAP', 'Subjetivo', 'Objetivo', 'Análisis', 'Plan', 1, '2026-09-14 09:56:32'),
(12, 12, 12, 12, 'Narrativa', 'N/A', 'N/A', 'Análisis', 'Plan', 1, '2026-09-14 09:56:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificacion`
--

CREATE TABLE `notificacion` (
  `id_notificacion` int(10) UNSIGNED NOT NULL,
  `id_usuario` int(10) UNSIGNED NOT NULL,
  `id_institucion` int(10) UNSIGNED NOT NULL,
  `tipo_notificacion` enum('Cita Médica','Alerta Clínica','Suscripción SaaS','Novedad de Agenda') NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `mensaje` varchar(255) NOT NULL,
  `estado_lectura` enum('No Leída','Leída','Archivada') NOT NULL DEFAULT 'No Leída',
  `entidad_relacionada` varchar(40) DEFAULT NULL,
  `id_entidad_relacionada` int(10) UNSIGNED DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `notificacion`
--

INSERT INTO `notificacion` (`id_notificacion`, `id_usuario`, `id_institucion`, `tipo_notificacion`, `titulo`, `mensaje`, `estado_lectura`, `entidad_relacionada`, `id_entidad_relacionada`, `fecha_creacion`) VALUES
(1, 1, 1, 'Cita Médica', 'Nueva Cita', 'Cita agendada', 'No Leída', NULL, NULL, '2026-09-14 09:56:33'),
(2, 2, 2, 'Alerta Clínica', 'Alerta', 'Laboratorio', 'Leída', NULL, NULL, '2026-09-14 09:56:33'),
(3, 3, 3, 'Suscripción SaaS', 'Factura', 'Pago vencido', 'Archivada', NULL, NULL, '2026-09-14 09:56:33'),
(4, 4, 4, 'Novedad de Agenda', 'Bloqueo', 'Vacaciones', 'No Leída', NULL, NULL, '2026-09-14 09:56:33'),
(5, 5, 5, 'Cita Médica', 'Nueva Cita', 'Cita agendada', 'Leída', NULL, NULL, '2026-09-14 09:56:33'),
(6, 6, 6, 'Alerta Clínica', 'Alerta', 'Laboratorio', 'Archivada', NULL, NULL, '2026-09-14 09:56:33'),
(7, 7, 7, 'Suscripción SaaS', 'Factura', 'Pago vencido', 'No Leída', NULL, NULL, '2026-09-14 09:56:33'),
(8, 8, 8, 'Novedad de Agenda', 'Bloqueo', 'Vacaciones', 'Leída', NULL, NULL, '2026-09-14 09:56:33'),
(9, 9, 9, 'Cita Médica', 'Nueva Cita', 'Cita agendada', 'Archivada', NULL, NULL, '2026-09-14 09:56:33'),
(10, 10, 10, 'Alerta Clínica', 'Alerta', 'Laboratorio', 'No Leída', NULL, NULL, '2026-09-14 09:56:33'),
(11, 11, 11, 'Suscripción SaaS', 'Factura', 'Pago vencido', 'Leída', NULL, NULL, '2026-09-14 09:56:33'),
(12, 12, 12, 'Novedad de Agenda', 'Bloqueo', 'Vacaciones', 'Archivada', NULL, NULL, '2026-09-14 09:56:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `orden_examen`
--

CREATE TABLE `orden_examen` (
  `id_orden` int(10) UNSIGNED NOT NULL,
  `id_atencion` int(10) UNSIGNED NOT NULL,
  `id_paciente` int(10) UNSIGNED NOT NULL,
  `id_profesional` int(10) UNSIGNED NOT NULL,
  `tipo_examen` enum('Laboratorio Clínico','Imagenología','Procedimiento Especial','Otro') NOT NULL,
  `nombre_examen` varchar(150) NOT NULL,
  `justificacion_clinica` text NOT NULL,
  `estado` enum('Generada','Realizada','Cancelada') NOT NULL DEFAULT 'Generada',
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `orden_examen`
--

INSERT INTO `orden_examen` (`id_orden`, `id_atencion`, `id_paciente`, `id_profesional`, `tipo_examen`, `nombre_examen`, `justificacion_clinica`, `estado`, `fecha_registro`) VALUES
(1, 1, 1, 1, 'Laboratorio Clínico', 'Hemograma', 'Descarte anemia', 'Generada', '2026-09-14 09:56:32'),
(2, 2, 2, 2, 'Imagenología', 'Radiografía', 'Dolor óseo', 'Generada', '2026-09-14 09:56:32'),
(3, 3, 3, 3, 'Procedimiento Especial', 'Endoscopia', 'Reflujo crónico', 'Generada', '2026-09-14 09:56:32'),
(4, 4, 4, 4, 'Laboratorio Clínico', 'Glicemia', 'Control diabetes', 'Generada', '2026-09-14 09:56:32'),
(5, 5, 5, 5, 'Imagenología', 'Ecografía', 'Dolor abdominal', 'Generada', '2026-09-14 09:56:32'),
(6, 6, 6, 6, 'Otro', 'Electrocardiograma', 'Riesgo cardiovascular', 'Generada', '2026-09-14 09:56:32'),
(7, 7, 7, 7, 'Laboratorio Clínico', 'Perfil lipídico', 'Chequeo', 'Generada', '2026-09-14 09:56:32'),
(8, 8, 8, 8, 'Imagenología', 'TAC', 'Trauma', 'Generada', '2026-09-14 09:56:32'),
(9, 9, 9, 9, 'Procedimiento Especial', 'Biopsia', 'Lesión en piel', 'Generada', '2026-09-14 09:56:32'),
(10, 10, 10, 10, 'Laboratorio Clínico', 'Coproscópico', 'Diarrea', 'Generada', '2026-09-14 09:56:32'),
(11, 11, 11, 11, 'Imagenología', 'Resonancia', 'Dorsalgia', 'Generada', '2026-09-14 09:56:32'),
(12, 12, 12, 12, 'Otro', 'Espirometría', 'Asma', 'Generada', '2026-09-14 09:56:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paciente`
--

CREATE TABLE `paciente` (
  `id_paciente` int(10) UNSIGNED NOT NULL,
  `id_institucion` int(10) UNSIGNED NOT NULL,
  `tipo_documento` enum('CC','TI','RC','CE','Pasaporte','PEP','PPT') NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `nombres` varchar(60) NOT NULL,
  `apellidos` varchar(60) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `sexo_biologico` enum('Masculino','Femenino') NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `correo_electronico` varchar(100) DEFAULT NULL,
  `direccion_residencial` varchar(150) DEFAULT NULL,
  `contacto_emergencia_nombre` varchar(100) DEFAULT NULL,
  `contacto_emergencia_parentesco` varchar(40) DEFAULT NULL,
  `contacto_emergencia_telefono` varchar(20) DEFAULT NULL,
  `eps` varchar(60) DEFAULT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `paciente`
--

INSERT INTO `paciente` (`id_paciente`, `id_institucion`, `tipo_documento`, `numero_documento`, `nombres`, `apellidos`, `fecha_nacimiento`, `sexo_biologico`, `telefono`, `correo_electronico`, `direccion_residencial`, `contacto_emergencia_nombre`, `contacto_emergencia_parentesco`, `contacto_emergencia_telefono`, `eps`, `estado`, `fecha_registro`) VALUES
(1, 1, 'CC', '10980001', 'Nombre1', 'Apellido1', '1990-01-01', 'Masculino', '311', 'p1@mail.com', 'Cra 1', 'Contacto', 'Padre', '322', 'EPS', 'Activo', '2026-09-14 09:56:32'),
(2, 2, 'CC', '10980002', 'Nombre2', 'Apellido2', '1990-01-01', 'Femenino', '311', 'p2@mail.com', 'Cra 1', 'Contacto', 'Madre', '322', 'EPS', 'Activo', '2026-09-14 09:56:32'),
(3, 3, 'CC', '10980003', 'Nombre3', 'Apellido3', '1990-01-01', 'Masculino', '311', 'p3@mail.com', 'Cra 1', 'Contacto', 'Padre', '322', 'EPS', 'Activo', '2026-09-14 09:56:32'),
(4, 4, 'CC', '10980004', 'Nombre4', 'Apellido4', '1990-01-01', 'Femenino', '311', 'p4@mail.com', 'Cra 1', 'Contacto', 'Padre', '322', 'EPS', 'Activo', '2026-09-14 09:56:32'),
(5, 5, 'CC', '10980005', 'Nombre5', 'Apellido5', '1990-01-01', 'Masculino', '311', 'p5@mail.com', 'Cra 1', 'Contacto', 'Padre', '322', 'EPS', 'Activo', '2026-09-14 09:56:32'),
(6, 6, 'CC', '10980006', 'Nombre6', 'Apellido6', '1990-01-01', 'Femenino', '311', 'p6@mail.com', 'Cra 1', 'Contacto', 'Padre', '322', 'EPS', 'Activo', '2026-09-14 09:56:32'),
(7, 7, 'CC', '10980007', 'Nombre7', 'Apellido7', '1990-01-01', 'Masculino', '311', 'p7@mail.com', 'Cra 1', 'Contacto', 'Padre', '322', 'EPS', 'Activo', '2026-09-14 09:56:32'),
(8, 8, 'CC', '10980008', 'Nombre8', 'Apellido8', '1990-01-01', 'Femenino', '311', 'p8@mail.com', 'Cra 1', 'Contacto', 'Padre', '322', 'EPS', 'Activo', '2026-09-14 09:56:32'),
(9, 9, 'CC', '10980009', 'Nombre9', 'Apellido9', '1990-01-01', 'Masculino', '311', 'p9@mail.com', 'Cra 1', 'Contacto', 'Padre', '322', 'EPS', 'Activo', '2026-09-14 09:56:32'),
(10, 10, 'CC', '10980010', 'Nombre10', 'Apellido10', '1990-01-01', 'Femenino', '311', 'p10@mail.com', 'Cra 1', 'Contacto', 'Padre', '322', 'EPS', 'Activo', '2026-09-14 09:56:32'),
(11, 11, 'CC', '10980011', 'Nombre11', 'Apellido11', '1990-01-01', 'Masculino', '311', 'p11@mail.com', 'Cra 1', 'Contacto', 'Padre', '322', 'EPS', 'Activo', '2026-09-14 09:56:32'),
(12, 12, 'CC', '10980012', 'Nombre12', 'Apellido12', '1990-01-01', 'Femenino', '311', 'p12@mail.com', 'Cra 1', 'Contacto', 'Padre', '322', 'EPS', 'Activo', '2026-09-14 09:56:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permiso`
--

CREATE TABLE `permiso` (
  `id_permiso` smallint(5) UNSIGNED NOT NULL,
  `codigo_modulo` varchar(10) NOT NULL,
  `nombre_permiso` varchar(80) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `permiso`
--

INSERT INTO `permiso` (`id_permiso`, `codigo_modulo`, `nombre_permiso`) VALUES
(1, 'M01', 'Ver Dashboard'),
(2, 'M02', 'Gestionar Usuarios'),
(3, 'M03', 'Gestionar Pacientes'),
(4, 'M04', 'Ver Agenda'),
(5, 'M05', 'Agendar Citas'),
(6, 'M06', 'Iniciar Atención'),
(7, 'M07', 'Firmar Historia'),
(8, 'M08', 'Recetar Medicamentos'),
(9, 'M09', 'Ver Facturación'),
(10, 'M10', 'Aprobar Órdenes'),
(11, 'M11', 'Generar Reportes'),
(12, 'M12', 'Configurar Sistema'),
(13, 'MOD-13', 'Notificaciones'),
(14, 'MOD-14', 'Reportes y Estadísticas'),
(15, 'MOD-15', 'Dashboard');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plan_comercial`
--

CREATE TABLE `plan_comercial` (
  `id_plan` int(10) UNSIGNED NOT NULL,
  `nombre_plan` varchar(50) NOT NULL,
  `tarifa_mensual` decimal(12,2) NOT NULL,
  `limite_medicos` int(10) UNSIGNED NOT NULL,
  `limite_pacientes` int(10) UNSIGNED NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL DEFAULT 'Activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `plan_comercial`
--

INSERT INTO `plan_comercial` (`id_plan`, `nombre_plan`, `tarifa_mensual`, `limite_medicos`, `limite_pacientes`, `estado`) VALUES
(1, 'Básico', 150000.00, 3, 300, 'Activo'),
(2, 'Profesional', 350000.00, 10, 2000, 'Activo'),
(3, 'Empresarial', 750000.00, 30, 10000, 'Activo'),
(4, 'Corporativo', 900000.00, 50, 15000, 'Activo'),
(5, 'Plan_5', 100000.00, 2, 200, 'Activo'),
(6, 'Plan_6', 150000.00, 4, 400, 'Activo'),
(7, 'Plan_7', 200000.00, 6, 600, 'Activo'),
(8, 'Plan_8', 250000.00, 8, 800, 'Activo'),
(9, 'Plan_9', 300000.00, 10, 1000, 'Activo'),
(10, 'Plan_10', 350000.00, 12, 1200, 'Activo'),
(11, 'Plan_11', 400000.00, 14, 1400, 'Activo'),
(12, 'Plan_12', 450000.00, 16, 1600, 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plan_modulo_funcional`
--

CREATE TABLE `plan_modulo_funcional` (
  `id_plan` int(10) UNSIGNED NOT NULL,
  `codigo_modulo` varchar(10) NOT NULL,
  `habilitado` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `plan_modulo_funcional`
--

INSERT INTO `plan_modulo_funcional` (`id_plan`, `codigo_modulo`, `habilitado`) VALUES
(1, 'M01', 1),
(1, 'MOD-02', 1),
(1, 'MOD-03', 1),
(1, 'MOD-04', 1),
(1, 'MOD-05', 1),
(1, 'MOD-06', 1),
(1, 'MOD-07', 1),
(2, 'M02', 1),
(2, 'MOD-02', 1),
(2, 'MOD-03', 1),
(2, 'MOD-04', 1),
(2, 'MOD-05', 1),
(2, 'MOD-06', 1),
(2, 'MOD-07', 1),
(2, 'MOD-08', 1),
(2, 'MOD-09', 1),
(2, 'MOD-10', 1),
(2, 'MOD-11', 1),
(2, 'MOD-13', 1),
(2, 'MOD-15', 1),
(3, 'M01', 1),
(3, 'M02', 1),
(3, 'M03', 1),
(3, 'M04', 1),
(3, 'M05', 1),
(3, 'M06', 1),
(3, 'M07', 1),
(3, 'M08', 1),
(3, 'M09', 1),
(3, 'M10', 1),
(3, 'M11', 1),
(3, 'M12', 1),
(3, 'MOD-13', 1),
(3, 'MOD-14', 1),
(3, 'MOD-15', 1),
(4, 'M04', 1),
(5, 'M05', 1),
(6, 'M06', 1),
(7, 'M07', 1),
(8, 'M08', 1),
(9, 'M09', 1),
(10, 'M10', 1),
(11, 'M11', 1),
(12, 'M12', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profesional_especialidad`
--

CREATE TABLE `profesional_especialidad` (
  `id_profesional` int(10) UNSIGNED NOT NULL,
  `id_especialidad` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `profesional_especialidad`
--

INSERT INTO `profesional_especialidad` (`id_profesional`, `id_especialidad`) VALUES
(1, 1),
(2, 2),
(2, 3),
(3, 3),
(4, 4),
(5, 5),
(6, 6),
(7, 7),
(8, 8),
(9, 9),
(10, 10),
(11, 11),
(12, 12);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profesional_salud`
--

CREATE TABLE `profesional_salud` (
  `id_profesional` int(10) UNSIGNED NOT NULL,
  `id_usuario` int(10) UNSIGNED NOT NULL,
  `tarjeta_profesional` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `profesional_salud`
--

INSERT INTO `profesional_salud` (`id_profesional`, `id_usuario`, `tarjeta_profesional`) VALUES
(1, 1, 'TP-123'),
(2, 2, 'TP-246'),
(3, 3, 'TP-369'),
(4, 4, 'TP-492'),
(5, 5, 'TP-615'),
(6, 6, 'TP-738'),
(7, 7, 'TP-861'),
(8, 8, 'TP-984'),
(9, 9, 'TP-1107'),
(10, 10, 'TP-1230'),
(11, 11, 'TP-1353'),
(12, 12, 'TP-1476');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reporte_generado`
--

CREATE TABLE `reporte_generado` (
  `id_reporte` int(10) UNSIGNED NOT NULL,
  `id_institucion` int(10) UNSIGNED NOT NULL,
  `id_usuario_generador` int(10) UNSIGNED NOT NULL,
  `tipo_reporte` enum('Volumen Atenciones','Epidemiológico CIE-10','Inasistencias','Ocupación Consultorios','Productividad Médica','Facturación SaaS') NOT NULL,
  `parametros_filtro` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parametros_filtro`)),
  `formato_exportacion` enum('PDF','Excel/CSV') NOT NULL,
  `datos_anonimizados` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_generacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reporte_generado`
--

INSERT INTO `reporte_generado` (`id_reporte`, `id_institucion`, `id_usuario_generador`, `tipo_reporte`, `parametros_filtro`, `formato_exportacion`, `datos_anonimizados`, `fecha_generacion`) VALUES
(1, 1, 1, 'Volumen Atenciones', NULL, 'PDF', 0, '2026-09-14 09:56:33'),
(2, 2, 2, 'Epidemiológico CIE-10', NULL, 'Excel/CSV', 1, '2026-09-14 09:56:33'),
(3, 3, 3, 'Inasistencias', NULL, 'PDF', 0, '2026-09-14 09:56:33'),
(4, 4, 4, 'Ocupación Consultorios', NULL, 'Excel/CSV', 0, '2026-09-14 09:56:33'),
(5, 5, 5, 'Productividad Médica', NULL, 'PDF', 0, '2026-09-14 09:56:33'),
(6, 6, 6, 'Facturación SaaS', NULL, 'Excel/CSV', 0, '2026-09-14 09:56:33'),
(7, 7, 7, 'Volumen Atenciones', NULL, 'PDF', 0, '2026-09-14 09:56:33'),
(8, 8, 8, 'Epidemiológico CIE-10', NULL, 'Excel/CSV', 1, '2026-09-14 09:56:33'),
(9, 9, 9, 'Inasistencias', NULL, 'PDF', 0, '2026-09-14 09:56:33'),
(10, 10, 10, 'Ocupación Consultorios', NULL, 'Excel/CSV', 0, '2026-09-14 09:56:33'),
(11, 11, 11, 'Productividad Médica', NULL, 'PDF', 0, '2026-09-14 09:56:33'),
(12, 12, 12, 'Facturación SaaS', NULL, 'Excel/CSV', 0, '2026-09-14 09:56:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol`
--

CREATE TABLE `rol` (
  `id_rol` tinyint(3) UNSIGNED NOT NULL,
  `nombre_rol` varchar(30) NOT NULL,
  `descripcion` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `rol`
--

INSERT INTO `rol` (`id_rol`, `nombre_rol`, `descripcion`) VALUES
(1, 'SuperAdmin', 'Administrador global'),
(2, 'Admin IPS', 'Admin clínica'),
(3, 'Médico', 'Profesional salud'),
(4, 'Recepción', 'Control turnos'),
(5, 'Paciente', 'Usuario final'),
(6, 'Enfermería', 'Asistencia médica'),
(7, 'Laboratorista', 'Análisis clínico'),
(8, 'Auditor', 'Revisión cuentas'),
(9, 'Farmaceuta', 'Entrega medicamentos'),
(10, 'Soporte', 'Soporte técnico'),
(11, 'Gerencia', 'Toma decisiones'),
(12, 'Especialista', 'Médico especialista');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol_permiso`
--

CREATE TABLE `rol_permiso` (
  `id_rol` tinyint(3) UNSIGNED NOT NULL,
  `id_permiso` smallint(5) UNSIGNED NOT NULL,
  `nivel_acceso` enum('Lectura','Lectura/Escritura','Sin acceso') NOT NULL DEFAULT 'Lectura'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `rol_permiso`
--

INSERT INTO `rol_permiso` (`id_rol`, `id_permiso`, `nivel_acceso`) VALUES
(1, 1, 'Lectura/Escritura'),
(1, 2, 'Lectura/Escritura'),
(1, 3, 'Sin acceso'),
(1, 4, 'Sin acceso'),
(1, 5, 'Sin acceso'),
(1, 6, 'Sin acceso'),
(1, 7, 'Sin acceso'),
(1, 8, 'Sin acceso'),
(1, 9, 'Sin acceso'),
(1, 10, 'Sin acceso'),
(1, 11, 'Sin acceso'),
(1, 12, 'Sin acceso'),
(1, 13, 'Lectura/Escritura'),
(1, 14, 'Lectura'),
(1, 15, 'Lectura'),
(2, 1, 'Sin acceso'),
(2, 2, 'Lectura/Escritura'),
(2, 3, 'Lectura/Escritura'),
(2, 4, 'Lectura/Escritura'),
(2, 5, 'Lectura/Escritura'),
(2, 6, 'Lectura/Escritura'),
(2, 7, 'Lectura/Escritura'),
(2, 8, 'Lectura'),
(2, 9, 'Sin acceso'),
(2, 10, 'Sin acceso'),
(2, 11, 'Sin acceso'),
(2, 12, 'Lectura'),
(2, 13, 'Lectura/Escritura'),
(2, 14, 'Lectura/Escritura'),
(2, 15, 'Lectura'),
(3, 1, 'Sin acceso'),
(3, 2, 'Sin acceso'),
(3, 3, 'Lectura'),
(3, 4, 'Lectura'),
(3, 5, 'Lectura'),
(3, 6, 'Lectura'),
(3, 7, 'Lectura'),
(3, 8, 'Lectura/Escritura'),
(3, 9, 'Lectura/Escritura'),
(3, 10, 'Lectura/Escritura'),
(3, 11, 'Lectura/Escritura'),
(3, 12, 'Lectura/Escritura'),
(3, 13, 'Lectura'),
(3, 14, 'Lectura'),
(3, 15, 'Lectura'),
(4, 1, 'Sin acceso'),
(4, 2, 'Sin acceso'),
(4, 3, 'Lectura/Escritura'),
(4, 4, 'Lectura'),
(4, 5, 'Lectura'),
(4, 6, 'Lectura'),
(4, 7, 'Lectura/Escritura'),
(4, 8, 'Sin acceso'),
(4, 9, 'Sin acceso'),
(4, 10, 'Sin acceso'),
(4, 11, 'Sin acceso'),
(4, 12, 'Sin acceso'),
(4, 13, 'Lectura'),
(4, 14, 'Sin acceso'),
(4, 15, 'Lectura'),
(5, 1, 'Sin acceso'),
(5, 2, 'Sin acceso'),
(5, 3, 'Lectura'),
(5, 4, 'Sin acceso'),
(5, 5, 'Lectura/Escritura'),
(5, 6, 'Sin acceso'),
(5, 7, 'Lectura/Escritura'),
(5, 8, 'Sin acceso'),
(5, 9, 'Lectura'),
(5, 10, 'Sin acceso'),
(5, 11, 'Lectura'),
(5, 12, 'Sin acceso'),
(5, 13, 'Lectura'),
(5, 14, 'Sin acceso'),
(5, 15, 'Sin acceso'),
(6, 1, 'Sin acceso'),
(6, 2, 'Sin acceso'),
(6, 3, 'Sin acceso'),
(6, 4, 'Sin acceso'),
(6, 5, 'Sin acceso'),
(6, 6, 'Lectura/Escritura'),
(6, 7, 'Sin acceso'),
(6, 8, 'Sin acceso'),
(6, 9, 'Sin acceso'),
(6, 10, 'Sin acceso'),
(6, 11, 'Sin acceso'),
(6, 12, 'Sin acceso'),
(6, 13, 'Sin acceso'),
(6, 14, 'Sin acceso'),
(6, 15, 'Sin acceso'),
(7, 1, 'Sin acceso'),
(7, 2, 'Sin acceso'),
(7, 3, 'Sin acceso'),
(7, 4, 'Sin acceso'),
(7, 5, 'Sin acceso'),
(7, 6, 'Sin acceso'),
(7, 7, 'Lectura'),
(7, 8, 'Sin acceso'),
(7, 9, 'Sin acceso'),
(7, 10, 'Sin acceso'),
(7, 11, 'Sin acceso'),
(7, 12, 'Sin acceso'),
(7, 13, 'Sin acceso'),
(7, 14, 'Sin acceso'),
(7, 15, 'Sin acceso'),
(8, 1, 'Sin acceso'),
(8, 2, 'Sin acceso'),
(8, 3, 'Sin acceso'),
(8, 4, 'Sin acceso'),
(8, 5, 'Sin acceso'),
(8, 6, 'Sin acceso'),
(8, 7, 'Sin acceso'),
(8, 8, 'Lectura/Escritura'),
(8, 9, 'Sin acceso'),
(8, 10, 'Sin acceso'),
(8, 11, 'Sin acceso'),
(8, 12, 'Sin acceso'),
(8, 13, 'Sin acceso'),
(8, 14, 'Sin acceso'),
(8, 15, 'Sin acceso'),
(9, 1, 'Sin acceso'),
(9, 2, 'Sin acceso'),
(9, 3, 'Sin acceso'),
(9, 4, 'Sin acceso'),
(9, 5, 'Sin acceso'),
(9, 6, 'Sin acceso'),
(9, 7, 'Sin acceso'),
(9, 8, 'Sin acceso'),
(9, 9, 'Lectura/Escritura'),
(9, 10, 'Sin acceso'),
(9, 11, 'Sin acceso'),
(9, 12, 'Sin acceso'),
(9, 13, 'Sin acceso'),
(9, 14, 'Sin acceso'),
(9, 15, 'Sin acceso'),
(10, 1, 'Sin acceso'),
(10, 2, 'Sin acceso'),
(10, 3, 'Sin acceso'),
(10, 4, 'Sin acceso'),
(10, 5, 'Sin acceso'),
(10, 6, 'Sin acceso'),
(10, 7, 'Sin acceso'),
(10, 8, 'Sin acceso'),
(10, 9, 'Sin acceso'),
(10, 10, 'Lectura'),
(10, 11, 'Sin acceso'),
(10, 12, 'Sin acceso'),
(10, 13, 'Sin acceso'),
(10, 14, 'Sin acceso'),
(10, 15, 'Sin acceso'),
(11, 1, 'Sin acceso'),
(11, 2, 'Sin acceso'),
(11, 3, 'Sin acceso'),
(11, 4, 'Sin acceso'),
(11, 5, 'Sin acceso'),
(11, 6, 'Sin acceso'),
(11, 7, 'Sin acceso'),
(11, 8, 'Sin acceso'),
(11, 9, 'Sin acceso'),
(11, 10, 'Sin acceso'),
(11, 11, 'Lectura/Escritura'),
(11, 12, 'Sin acceso'),
(11, 13, 'Sin acceso'),
(11, 14, 'Sin acceso'),
(11, 15, 'Sin acceso'),
(12, 1, 'Sin acceso'),
(12, 2, 'Sin acceso'),
(12, 3, 'Sin acceso'),
(12, 4, 'Sin acceso'),
(12, 5, 'Sin acceso'),
(12, 6, 'Sin acceso'),
(12, 7, 'Sin acceso'),
(12, 8, 'Sin acceso'),
(12, 9, 'Sin acceso'),
(12, 10, 'Sin acceso'),
(12, 11, 'Sin acceso'),
(12, 12, 'Lectura'),
(12, 13, 'Sin acceso'),
(12, 14, 'Sin acceso'),
(12, 15, 'Sin acceso');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sede`
--

CREATE TABLE `sede` (
  `id_sede` int(10) UNSIGNED NOT NULL,
  `id_institucion` int(10) UNSIGNED NOT NULL,
  `nombre_sede` varchar(80) NOT NULL,
  `direccion` varchar(150) NOT NULL,
  `ciudad` varchar(60) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `estado` enum('Activa','Inactiva') NOT NULL DEFAULT 'Activa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `sede`
--

INSERT INTO `sede` (`id_sede`, `id_institucion`, `nombre_sede`, `direccion`, `ciudad`, `telefono`, `estado`) VALUES
(1, 1, 'Sede 1', 'Dir 1', 'Ciudad 1', '123', 'Activa'),
(2, 2, 'Sede 2', 'Dir 2', 'Ciudad 2', '123', 'Activa'),
(3, 3, 'Sede 3', 'Dir 3', 'Ciudad 3', '123', 'Activa'),
(4, 4, 'Sede 4', 'Dir 4', 'Ciudad 4', '123', 'Activa'),
(5, 5, 'Sede 5', 'Dir 5', 'Ciudad 5', '123', 'Activa'),
(6, 6, 'Sede 6', 'Dir 6', 'Ciudad 6', '123', 'Activa'),
(7, 7, 'Sede 7', 'Dir 7', 'Ciudad 7', '123', 'Activa'),
(8, 8, 'Sede 8', 'Dir 8', 'Ciudad 8', '123', 'Activa'),
(9, 9, 'Sede 9', 'Dir 9', 'Ciudad 9', '123', 'Activa'),
(10, 10, 'Sede 10', 'Dir 10', 'Ciudad 10', '123', 'Activa'),
(11, 11, 'Sede 11', 'Dir 11', 'Ciudad 11', '123', 'Activa'),
(12, 12, 'Sede 12', 'Dir 12', 'Ciudad 12', '123', 'Activa');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `seguimiento_control`
--

CREATE TABLE `seguimiento_control` (
  `id_seguimiento` int(10) UNSIGNED NOT NULL,
  `id_paciente` int(10) UNSIGNED NOT NULL,
  `id_diagnostico` int(10) UNSIGNED NOT NULL,
  `id_profesional` int(10) UNSIGNED NOT NULL,
  `fecha_ultimo_control` date NOT NULL,
  `fecha_proximo_control` date NOT NULL,
  `intervalo_sugerido` enum('15 días','1 mes','3 meses','6 meses') NOT NULL,
  `estado` enum('Al día','Próximo a vencer','Vencido') NOT NULL DEFAULT 'Al día'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `seguimiento_control`
--

INSERT INTO `seguimiento_control` (`id_seguimiento`, `id_paciente`, `id_diagnostico`, `id_profesional`, `fecha_ultimo_control`, `fecha_proximo_control`, `intervalo_sugerido`, `estado`) VALUES
(1, 1, 1, 1, '2026-09-01', '2026-10-01', '1 mes', 'Al día'),
(2, 2, 2, 2, '2026-09-01', '2026-10-01', '1 mes', 'Al día'),
(3, 3, 3, 3, '2026-09-01', '2026-10-01', '1 mes', 'Al día'),
(4, 4, 4, 4, '2026-09-01', '2026-10-01', '1 mes', 'Al día'),
(5, 5, 5, 5, '2026-09-01', '2026-10-01', '1 mes', 'Al día'),
(6, 6, 6, 6, '2026-09-01', '2026-10-01', '1 mes', 'Al día'),
(7, 7, 7, 7, '2026-09-01', '2026-10-01', '1 mes', 'Al día'),
(8, 8, 8, 8, '2026-09-01', '2026-10-01', '1 mes', 'Al día'),
(9, 9, 9, 9, '2026-09-01', '2026-10-01', '1 mes', 'Al día'),
(10, 10, 10, 10, '2026-09-01', '2026-10-01', '1 mes', 'Al día'),
(11, 11, 11, 11, '2026-09-01', '2026-10-01', '1 mes', 'Al día'),
(12, 12, 12, 12, '2026-09-01', '2026-10-01', '1 mes', 'Al día');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `signos_vitales`
--

CREATE TABLE `signos_vitales` (
  `id_signos` int(10) UNSIGNED NOT NULL,
  `id_atencion` int(10) UNSIGNED NOT NULL,
  `presion_sistolica` smallint(5) UNSIGNED NOT NULL,
  `presion_diastolica` smallint(5) UNSIGNED NOT NULL,
  `frecuencia_cardiaca` smallint(5) UNSIGNED NOT NULL,
  `frecuencia_respiratoria` smallint(5) UNSIGNED NOT NULL,
  `temperatura` decimal(4,1) NOT NULL,
  `saturacion_oxigeno` tinyint(3) UNSIGNED NOT NULL,
  `peso_kg` decimal(5,2) NOT NULL,
  `talla_cm` decimal(5,2) NOT NULL,
  `imc` decimal(4,1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `signos_vitales`
--

INSERT INTO `signos_vitales` (`id_signos`, `id_atencion`, `presion_sistolica`, `presion_diastolica`, `frecuencia_cardiaca`, `frecuencia_respiratoria`, `temperatura`, `saturacion_oxigeno`, `peso_kg`, `talla_cm`, `imc`) VALUES
(1, 1, 120, 80, 80, 18, 36.5, 98, 70.00, 170.00, 24.2),
(2, 2, 120, 80, 80, 18, 36.5, 98, 70.00, 170.00, 24.2),
(3, 3, 120, 80, 80, 18, 36.5, 98, 70.00, 170.00, 24.2),
(4, 4, 120, 80, 80, 18, 36.5, 98, 70.00, 170.00, 24.2),
(5, 5, 120, 80, 80, 18, 36.5, 98, 70.00, 170.00, 24.2),
(6, 6, 120, 80, 80, 18, 36.5, 98, 70.00, 170.00, 24.2),
(7, 7, 120, 80, 80, 18, 36.5, 98, 70.00, 170.00, 24.2),
(8, 8, 120, 80, 80, 18, 36.5, 98, 70.00, 170.00, 24.2),
(9, 9, 120, 80, 80, 18, 36.5, 98, 70.00, 170.00, 24.2),
(10, 10, 120, 80, 80, 18, 36.5, 98, 70.00, 170.00, 24.2),
(11, 11, 120, 80, 80, 18, 36.5, 98, 70.00, 170.00, 24.2),
(12, 12, 120, 80, 80, 18, 36.5, 98, 70.00, 170.00, 24.2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `suscripcion`
--

CREATE TABLE `suscripcion` (
  `id_suscripcion` int(10) UNSIGNED NOT NULL,
  `id_institucion` int(10) UNSIGNED NOT NULL,
  `id_plan` int(10) UNSIGNED NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_corte` date NOT NULL,
  `estado` enum('Vigente','Por Vencer','Vencida') NOT NULL DEFAULT 'Vigente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `suscripcion`
--

INSERT INTO `suscripcion` (`id_suscripcion`, `id_institucion`, `id_plan`, `fecha_inicio`, `fecha_corte`, `estado`) VALUES
(1, 1, 1, '2026-01-01', '2026-12-31', 'Vigente'),
(2, 2, 2, '2026-01-01', '2026-12-31', 'Vigente'),
(3, 3, 3, '2026-01-01', '2026-12-31', 'Vigente'),
(4, 4, 4, '2026-01-01', '2026-12-31', 'Vigente'),
(5, 5, 5, '2026-01-01', '2026-12-31', 'Vigente'),
(6, 6, 6, '2026-01-01', '2026-12-31', 'Vigente'),
(7, 7, 7, '2026-01-01', '2026-12-31', 'Vigente'),
(8, 8, 8, '2026-01-01', '2026-12-31', 'Vigente'),
(9, 9, 9, '2026-01-01', '2026-12-31', 'Vigente'),
(10, 10, 10, '2026-01-01', '2026-12-31', 'Vigente'),
(11, 11, 11, '2026-01-01', '2026-12-31', 'Vigente'),
(12, 12, 12, '2026-01-01', '2026-12-31', 'Vigente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tratamiento`
--

CREATE TABLE `tratamiento` (
  `id_tratamiento` int(10) UNSIGNED NOT NULL,
  `id_diagnostico` int(10) UNSIGNED NOT NULL,
  `id_paciente` int(10) UNSIGNED NOT NULL,
  `id_profesional` int(10) UNSIGNED NOT NULL,
  `tipo_tratamiento` enum('Farmacológico','No farmacológico','Terapia') NOT NULL,
  `recomendaciones` text DEFAULT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin_estimada` date DEFAULT NULL,
  `estado` enum('Activo','Finalizado','Suspendido') NOT NULL DEFAULT 'Activo',
  `motivo_finalizacion` enum('Adversidad','Mejoría clínica','Ajuste de dosis','Abandono','Fallecimiento') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tratamiento`
--

INSERT INTO `tratamiento` (`id_tratamiento`, `id_diagnostico`, `id_paciente`, `id_profesional`, `tipo_tratamiento`, `recomendaciones`, `fecha_inicio`, `fecha_fin_estimada`, `estado`, `motivo_finalizacion`) VALUES
(1, 1, 1, 1, 'Farmacológico', 'Reposo', '2026-09-10', NULL, 'Activo', NULL),
(2, 2, 2, 2, 'Terapia', 'Terapia física', '2026-09-10', NULL, 'Activo', NULL),
(3, 3, 3, 3, 'No farmacológico', 'Dieta', '2026-09-10', NULL, 'Activo', NULL),
(4, 4, 4, 4, 'Farmacológico', 'Reposo', '2026-09-10', NULL, 'Activo', NULL),
(5, 5, 5, 5, 'Terapia', 'Terapia física', '2026-09-10', NULL, 'Activo', NULL),
(6, 6, 6, 6, 'No farmacológico', 'Dieta', '2026-09-10', NULL, 'Activo', NULL),
(7, 7, 7, 7, 'Farmacológico', 'Reposo', '2026-09-10', NULL, 'Activo', NULL),
(8, 8, 8, 8, 'Terapia', 'Terapia física', '2026-09-10', NULL, 'Activo', NULL),
(9, 9, 9, 9, 'No farmacológico', 'Dieta', '2026-09-10', NULL, 'Activo', NULL),
(10, 10, 10, 10, 'Farmacológico', 'Reposo', '2026-09-10', NULL, 'Activo', NULL),
(11, 11, 11, 11, 'Terapia', 'Terapia física', '2026-09-10', NULL, 'Activo', NULL),
(12, 12, 12, 12, 'No farmacológico', 'Dieta', '2026-09-10', NULL, 'Activo', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id_usuario` int(10) UNSIGNED NOT NULL,
  `id_institucion` int(10) UNSIGNED DEFAULT NULL,
  `id_rol` tinyint(3) UNSIGNED NOT NULL,
  `tipo_documento` enum('CC','TI','RC','CE','Pasaporte','PEP','PPT') NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `nombre_completo` varchar(120) NOT NULL,
  `correo_electronico` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `contrasena_hash` varchar(255) NOT NULL,
  `intentos_fallidos` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `fecha_ultimo_acceso` datetime DEFAULT NULL,
  `estado` enum('Activo','Inactivo','Bloqueado') NOT NULL DEFAULT 'Activo',
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `token_recuperacion` varchar(255) DEFAULT NULL,
  `token_expiracion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id_usuario`, `id_institucion`, `id_rol`, `tipo_documento`, `numero_documento`, `nombre_completo`, `correo_electronico`, `telefono`, `contrasena_hash`, `intentos_fallidos`, `fecha_ultimo_acceso`, `estado`, `fecha_creacion`, `token_recuperacion`, `token_expiracion`) VALUES
(1, 1, 3, 'CC', '1002001', 'Usuario 1', 'u1@mail.com', '300123', '$2y$10$Qik0Md1iUcoFKkA6IWfnNOTBVwPVDnXFyKD5P7cqLSrcclCQovMRK', 0, '2026-11-14 17:31:57', 'Activo', '2026-09-14 09:56:31', NULL, NULL),
(2, 2, 3, 'CC', '1002002', 'Usuario 2', 'u2@mail.com', '300123', '$2y$10$Qik0Md1iUcoFKkA6IWfnNOTBVwPVDnXFyKD5P7cqLSrcclCQovMRK', 0, NULL, 'Activo', '2026-09-14 09:56:31', NULL, NULL),
(3, 3, 3, 'CC', '1002003', 'Usuario 3', 'u3@mail.com', '300123', '$2y$10$Qik0Md1iUcoFKkA6IWfnNOTBVwPVDnXFyKD5P7cqLSrcclCQovMRK', 0, NULL, 'Activo', '2026-09-14 09:56:31', NULL, NULL),
(4, 4, 3, 'CC', '1002004', 'Usuario 4', 'u4@mail.com', '300123', '$2y$10$Qik0Md1iUcoFKkA6IWfnNOTBVwPVDnXFyKD5P7cqLSrcclCQovMRK', 0, NULL, 'Activo', '2026-09-14 09:56:31', NULL, NULL),
(5, 5, 3, 'CC', '1002005', 'Usuario 5', 'u5@mail.com', '300123', '$2y$10$Qik0Md1iUcoFKkA6IWfnNOTBVwPVDnXFyKD5P7cqLSrcclCQovMRK', 0, NULL, 'Activo', '2026-09-14 09:56:31', NULL, NULL),
(6, 6, 3, 'CC', '1002006', 'Usuario 6', 'u6@mail.com', '300123', '$2y$10$Qik0Md1iUcoFKkA6IWfnNOTBVwPVDnXFyKD5P7cqLSrcclCQovMRK', 0, '2026-11-14 17:53:42', 'Activo', '2026-09-14 09:56:31', NULL, NULL),
(7, 7, 3, 'CC', '1002007', 'Usuario 7', 'u7@mail.com', '300123', '$2y$10$Qik0Md1iUcoFKkA6IWfnNOTBVwPVDnXFyKD5P7cqLSrcclCQovMRK', 0, NULL, 'Activo', '2026-09-14 09:56:31', NULL, NULL),
(8, 8, 3, 'CC', '1002008', 'Usuario 8', 'u8@mail.com', '300123', '$2y$10$Qik0Md1iUcoFKkA6IWfnNOTBVwPVDnXFyKD5P7cqLSrcclCQovMRK', 0, NULL, 'Activo', '2026-09-14 09:56:31', NULL, NULL),
(9, 9, 3, 'CC', '1002009', 'Usuario 9', 'u9@mail.com', '300123', '$2y$10$Qik0Md1iUcoFKkA6IWfnNOTBVwPVDnXFyKD5P7cqLSrcclCQovMRK', 0, NULL, 'Activo', '2026-09-14 09:56:31', NULL, NULL),
(10, 10, 3, 'CC', '10020010', 'Usuario 10', 'u10@mail.com', '300123', '$2y$10$Qik0Md1iUcoFKkA6IWfnNOTBVwPVDnXFyKD5P7cqLSrcclCQovMRK', 0, NULL, 'Activo', '2026-09-14 09:56:31', NULL, NULL),
(11, 11, 3, 'CC', '10020011', 'Usuario 11', 'u11@mail.com', '300123', '$2y$10$Qik0Md1iUcoFKkA6IWfnNOTBVwPVDnXFyKD5P7cqLSrcclCQovMRK', 0, NULL, 'Activo', '2026-09-14 09:56:31', NULL, NULL),
(12, 12, 3, 'CC', '10020012', 'Usuario 12', 'u12@mail.com', '300123', '$2y$10$Qik0Md1iUcoFKkA6IWfnNOTBVwPVDnXFyKD5P7cqLSrcclCQovMRK', 0, NULL, 'Activo', '2026-09-14 09:56:31', NULL, NULL),
(13, NULL, 1, 'CC', '1098765432', 'Laura Pineda Gómez', 'superadmin@saludsync.co', '300 111 2233', '$2y$10$bED622FTphUnhDakE8bO3.GMcEi8rl32cwfp2ZX4iaWdXqMTdjE7W', 0, '2026-11-17 22:24:19', 'Activo', '2026-11-12 07:39:41', NULL, NULL),
(14, 1, 2, 'CC', '63456789', 'María Fernanda Ruiz Salazar', 'admin@santalucia.co', '310 222 3344', '$2y$10$bED622FTphUnhDakE8bO3.GMcEi8rl32cwfp2ZX4iaWdXqMTdjE7W', 0, '2026-11-17 22:26:17', 'Activo', '2026-11-12 07:39:41', NULL, NULL),
(15, 1, 4, 'CC', '1005432109', 'Camila Ortiz Vargas', 'recepcion@santalucia.co', '313 555 6677', '$2y$10$bED622FTphUnhDakE8bO3.GMcEi8rl32cwfp2ZX4iaWdXqMTdjE7W', 0, '2026-11-18 09:19:07', 'Activo', '2026-11-12 07:39:41', NULL, NULL),
(16, 1, 5, 'CC', '91478432', 'Cesar Augusto Delgado Alvarado', 'cesarpipe31ingenieria@gmail.com', '+573153082008', '$2y$10$.Nvb4w4pETvoC1i0d6f9qe4v22YnyIdbEwqgGuLiZw45yCyPY4Yh.', 0, NULL, 'Activo', '2026-11-12 18:59:29', NULL, NULL),
(21, 16, 2, 'CC', '1098000111', 'Admin Prueba', 'admin@prueba.co', NULL, '$2y$10$Wo7JiMU.5Gc6s8KkGROVx./OlWEmkxp6TeXedDsFCOgmPndipQtdK', 0, NULL, 'Activo', '2026-11-16 07:56:15', NULL, NULL),
(22, 17, 2, 'CC', '109800011188', 'Admin Prueba', 'admin123@prueba.co', NULL, '$2y$10$fXbl0WlQ36ectz6PJS2YJu45Z3U3MK.UIiDXW2.NyQvOi9VIpembG', 0, NULL, 'Activo', '2026-11-16 07:59:07', NULL, NULL),
(23, 1, 5, 'CC', '1099000777', 'Paciente Prueba UI', 'pac.m2b@mail.com', '3001112233', '$2y$10$nPfFR8fPLf85UTOfDPayp.Zo7YxjdpCUm3KLrdUXpaACL0qKF.662', 0, '2026-11-17 22:22:35', 'Activo', '2026-11-17 22:21:51', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_kpi_citas_dia`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vw_kpi_citas_dia` (
`id_institucion` int(10) unsigned
,`fecha_cita` date
,`total_citas` bigint(21)
,`atendidas` decimal(23,0)
,`canceladas` decimal(23,0)
,`inasistencias` decimal(23,0)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_kpi_citas_dia`
--
DROP TABLE IF EXISTS `vw_kpi_citas_dia`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_kpi_citas_dia`  AS SELECT `c`.`id_institucion` AS `id_institucion`, `c`.`fecha_cita` AS `fecha_cita`, count(0) AS `total_citas`, sum(`c`.`estado` = 'Atendida') AS `atendidas`, sum(`c`.`estado` = 'Cancelada') AS `canceladas`, sum(`c`.`estado` = 'Inasistencia') AS `inasistencias` FROM `cita_medica` AS `c` GROUP BY `c`.`id_institucion`, `c`.`fecha_cita` ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `agenda_medica`
--
ALTER TABLE `agenda_medica`
  ADD PRIMARY KEY (`id_agenda`),
  ADD KEY `fk_agenda_consultorio` (`id_consultorio`),
  ADD KEY `idx_agenda_profesional_dia` (`id_profesional`,`dia_semana`);

--
-- Indices de la tabla `anexo_clinico`
--
ALTER TABLE `anexo_clinico`
  ADD PRIMARY KEY (`id_anexo`),
  ADD KEY `fk_anexo_historia` (`id_historia`),
  ADD KEY `fk_anexo_atencion` (`id_atencion`),
  ADD KEY `fk_anexo_usuario` (`id_usuario_sube`);

--
-- Indices de la tabla `antecedente_clinico`
--
ALTER TABLE `antecedente_clinico`
  ADD PRIMARY KEY (`id_antecedente`),
  ADD KEY `fk_antecedente_paciente` (`id_paciente`),
  ADD KEY `fk_antecedente_profesional` (`id_profesional`),
  ADD KEY `fk_antecedente_atencion` (`id_atencion`);

--
-- Indices de la tabla `atencion_medica`
--
ALTER TABLE `atencion_medica`
  ADD PRIMARY KEY (`id_atencion`),
  ADD UNIQUE KEY `uq_atencion_cita` (`id_cita`),
  ADD KEY `fk_atencion_paciente` (`id_paciente`),
  ADD KEY `idx_atencion_profesional_estado` (`id_profesional`,`estado`);

--
-- Indices de la tabla `auditoria_clinica`
--
ALTER TABLE `auditoria_clinica`
  ADD PRIMARY KEY (`id_auditoria`),
  ADD KEY `fk_auditoria_usuario` (`id_usuario`);

--
-- Indices de la tabla `bloqueo_agenda`
--
ALTER TABLE `bloqueo_agenda`
  ADD PRIMARY KEY (`id_bloqueo`),
  ADD KEY `fk_bloqueo_profesional` (`id_profesional`);

--
-- Indices de la tabla `catalogo_cie10`
--
ALTER TABLE `catalogo_cie10`
  ADD PRIMARY KEY (`codigo_cie10`);

--
-- Indices de la tabla `cita_medica`
--
ALTER TABLE `cita_medica`
  ADD PRIMARY KEY (`id_cita`),
  ADD UNIQUE KEY `uq_cita_paciente_profesional_fecha` (`id_paciente`,`id_profesional`,`fecha_cita`),
  ADD UNIQUE KEY `uq_cita_profesional_fecha_hora` (`id_profesional`,`fecha_cita`,`hora_cita`),
  ADD UNIQUE KEY `uq_cita_consultorio_fecha_hora` (`id_consultorio`,`fecha_cita`,`hora_cita`),
  ADD UNIQUE KEY `uq_cita_paciente_fecha_hora` (`id_paciente`,`fecha_cita`,`hora_cita`),
  ADD UNIQUE KEY `uq_cita_prof_activa` (`id_profesional`,`fecha_cita`,`hora_cita`,`cupo_activo`),
  ADD UNIQUE KEY `uq_cita_cons_activa` (`id_consultorio`,`fecha_cita`,`hora_cita`,`cupo_activo`),
  ADD UNIQUE KEY `uq_cita_pac_activa` (`id_paciente`,`fecha_cita`,`hora_cita`,`cupo_activo`),
  ADD KEY `idx_cita_institucion_fecha` (`id_institucion`,`fecha_cita`),
  ADD KEY `idx_cita_fecha_estado` (`fecha_cita`,`estado`);

--
-- Indices de la tabla `configuracion_alerta`
--
ALTER TABLE `configuracion_alerta`
  ADD PRIMARY KEY (`id_configuracion`),
  ADD KEY `fk_configalerta_institucion` (`id_institucion`);

--
-- Indices de la tabla `configuracion_alerta_canal`
--
ALTER TABLE `configuracion_alerta_canal`
  ADD PRIMARY KEY (`id_configuracion`,`canal`);

--
-- Indices de la tabla `consultorio`
--
ALTER TABLE `consultorio`
  ADD PRIMARY KEY (`id_consultorio`),
  ADD UNIQUE KEY `uq_consultorio_sede_codigo` (`id_sede`,`codigo_consultorio`);

--
-- Indices de la tabla `diagnostico`
--
ALTER TABLE `diagnostico`
  ADD PRIMARY KEY (`id_diagnostico`),
  ADD KEY `idx_diagnostico_atencion_tipo` (`id_atencion`,`tipo_diagnostico`),
  ADD KEY `idx_diagnostico_cie10_fecha` (`codigo_cie10`,`fecha_registro`);

--
-- Indices de la tabla `disponibilidad_consultorio`
--
ALTER TABLE `disponibilidad_consultorio`
  ADD PRIMARY KEY (`id_disponibilidad`),
  ADD KEY `fk_disponibilidad_consultorio` (`id_consultorio`);

--
-- Indices de la tabla `especialidad`
--
ALTER TABLE `especialidad`
  ADD PRIMARY KEY (`id_especialidad`),
  ADD UNIQUE KEY `uq_especialidad_institucion_codigo` (`id_institucion`,`codigo_especialidad`),
  ADD KEY `idx_especialidad_institucion_estado` (`id_institucion`,`estado`);

--
-- Indices de la tabla `factura_saas`
--
ALTER TABLE `factura_saas`
  ADD PRIMARY KEY (`id_factura`),
  ADD UNIQUE KEY `uq_factura_numero` (`numero_factura`),
  ADD KEY `fk_factura_suscripcion` (`id_suscripcion`);

--
-- Indices de la tabla `historial_reprogramacion`
--
ALTER TABLE `historial_reprogramacion`
  ADD PRIMARY KEY (`id_historial`),
  ADD KEY `fk_historial_cita` (`id_cita`),
  ADD KEY `fk_historial_usuario` (`id_usuario_responsable`);

--
-- Indices de la tabla `historia_clinica`
--
ALTER TABLE `historia_clinica`
  ADD PRIMARY KEY (`id_historia`),
  ADD UNIQUE KEY `uq_historia_paciente_institucion` (`id_paciente`,`id_institucion`),
  ADD KEY `idx_historiaclinica_institucion_estado` (`id_institucion`,`estado`);

--
-- Indices de la tabla `institucion`
--
ALTER TABLE `institucion`
  ADD PRIMARY KEY (`id_institucion`),
  ADD UNIQUE KEY `uq_institucion_nit` (`nit`),
  ADD UNIQUE KEY `uq_institucion_reps` (`codigo_reps`);

--
-- Indices de la tabla `medicamento_formulado`
--
ALTER TABLE `medicamento_formulado`
  ADD PRIMARY KEY (`id_item_formula`),
  ADD KEY `fk_medformulado_tratamiento` (`id_tratamiento`);

--
-- Indices de la tabla `meta_clinica`
--
ALTER TABLE `meta_clinica`
  ADD PRIMARY KEY (`id_meta`),
  ADD KEY `fk_meta_seguimiento` (`id_seguimiento`);

--
-- Indices de la tabla `nota_evolucion`
--
ALTER TABLE `nota_evolucion`
  ADD PRIMARY KEY (`id_nota`),
  ADD KEY `fk_nota_historia` (`id_historia`),
  ADD KEY `fk_nota_atencion` (`id_atencion`),
  ADD KEY `fk_nota_profesional` (`id_profesional`);

--
-- Indices de la tabla `notificacion`
--
ALTER TABLE `notificacion`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `fk_notificacion_institucion` (`id_institucion`),
  ADD KEY `idx_notificacion_usuario_estado` (`id_usuario`,`estado_lectura`);

--
-- Indices de la tabla `orden_examen`
--
ALTER TABLE `orden_examen`
  ADD PRIMARY KEY (`id_orden`),
  ADD KEY `fk_orden_atencion` (`id_atencion`),
  ADD KEY `fk_orden_paciente` (`id_paciente`),
  ADD KEY `fk_orden_profesional` (`id_profesional`);

--
-- Indices de la tabla `paciente`
--
ALTER TABLE `paciente`
  ADD PRIMARY KEY (`id_paciente`),
  ADD UNIQUE KEY `uq_paciente_institucion_doc` (`id_institucion`,`numero_documento`),
  ADD KEY `idx_paciente_institucion_estado` (`id_institucion`,`estado`),
  ADD KEY `idx_paciente_numero_documento` (`numero_documento`),
  ADD KEY `idx_paciente_apellidos_nombres` (`apellidos`,`nombres`);

--
-- Indices de la tabla `permiso`
--
ALTER TABLE `permiso`
  ADD PRIMARY KEY (`id_permiso`);

--
-- Indices de la tabla `plan_comercial`
--
ALTER TABLE `plan_comercial`
  ADD PRIMARY KEY (`id_plan`),
  ADD UNIQUE KEY `uq_plan_nombre` (`nombre_plan`);

--
-- Indices de la tabla `plan_modulo_funcional`
--
ALTER TABLE `plan_modulo_funcional`
  ADD PRIMARY KEY (`id_plan`,`codigo_modulo`);

--
-- Indices de la tabla `profesional_especialidad`
--
ALTER TABLE `profesional_especialidad`
  ADD PRIMARY KEY (`id_profesional`,`id_especialidad`),
  ADD KEY `fk_profesesp_especialidad` (`id_especialidad`);

--
-- Indices de la tabla `profesional_salud`
--
ALTER TABLE `profesional_salud`
  ADD PRIMARY KEY (`id_profesional`),
  ADD UNIQUE KEY `uq_profesional_usuario` (`id_usuario`),
  ADD UNIQUE KEY `uq_profesional_tarjeta` (`tarjeta_profesional`);

--
-- Indices de la tabla `reporte_generado`
--
ALTER TABLE `reporte_generado`
  ADD PRIMARY KEY (`id_reporte`),
  ADD KEY `fk_reporte_usuario` (`id_usuario_generador`),
  ADD KEY `idx_reporte_institucion_fecha` (`id_institucion`,`fecha_generacion`);

--
-- Indices de la tabla `rol`
--
ALTER TABLE `rol`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `uq_rol_nombre` (`nombre_rol`);

--
-- Indices de la tabla `rol_permiso`
--
ALTER TABLE `rol_permiso`
  ADD PRIMARY KEY (`id_rol`,`id_permiso`),
  ADD KEY `fk_rolpermiso_permiso` (`id_permiso`);

--
-- Indices de la tabla `sede`
--
ALTER TABLE `sede`
  ADD PRIMARY KEY (`id_sede`),
  ADD KEY `idx_sede_institucion_estado` (`id_institucion`,`estado`);

--
-- Indices de la tabla `seguimiento_control`
--
ALTER TABLE `seguimiento_control`
  ADD PRIMARY KEY (`id_seguimiento`),
  ADD KEY `fk_seguimiento_paciente` (`id_paciente`),
  ADD KEY `fk_seguimiento_diagnostico` (`id_diagnostico`),
  ADD KEY `fk_seguimiento_profesional` (`id_profesional`),
  ADD KEY `idx_seguimiento_estado_fecha` (`estado`,`fecha_proximo_control`);

--
-- Indices de la tabla `signos_vitales`
--
ALTER TABLE `signos_vitales`
  ADD PRIMARY KEY (`id_signos`),
  ADD UNIQUE KEY `uq_signos_atencion` (`id_atencion`);

--
-- Indices de la tabla `suscripcion`
--
ALTER TABLE `suscripcion`
  ADD PRIMARY KEY (`id_suscripcion`),
  ADD KEY `fk_suscripcion_institucion` (`id_institucion`),
  ADD KEY `fk_suscripcion_plan` (`id_plan`);

--
-- Indices de la tabla `tratamiento`
--
ALTER TABLE `tratamiento`
  ADD PRIMARY KEY (`id_tratamiento`),
  ADD KEY `fk_tratamiento_diagnostico` (`id_diagnostico`),
  ADD KEY `fk_tratamiento_paciente` (`id_paciente`),
  ADD KEY `fk_tratamiento_profesional` (`id_profesional`),
  ADD KEY `idx_tratamiento_paciente_estado` (`id_paciente`,`estado`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `uq_usuario_institucion_correo` (`id_institucion`,`correo_electronico`),
  ADD KEY `fk_usuario_rol` (`id_rol`),
  ADD KEY `idx_usuario_numero_documento` (`numero_documento`),
  ADD KEY `idx_usuario_institucion_estado` (`id_institucion`,`estado`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `agenda_medica`
--
ALTER TABLE `agenda_medica`
  MODIFY `id_agenda` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `anexo_clinico`
--
ALTER TABLE `anexo_clinico`
  MODIFY `id_anexo` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `antecedente_clinico`
--
ALTER TABLE `antecedente_clinico`
  MODIFY `id_antecedente` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `atencion_medica`
--
ALTER TABLE `atencion_medica`
  MODIFY `id_atencion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `auditoria_clinica`
--
ALTER TABLE `auditoria_clinica`
  MODIFY `id_auditoria` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT de la tabla `bloqueo_agenda`
--
ALTER TABLE `bloqueo_agenda`
  MODIFY `id_bloqueo` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `cita_medica`
--
ALTER TABLE `cita_medica`
  MODIFY `id_cita` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `configuracion_alerta`
--
ALTER TABLE `configuracion_alerta`
  MODIFY `id_configuracion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `consultorio`
--
ALTER TABLE `consultorio`
  MODIFY `id_consultorio` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `diagnostico`
--
ALTER TABLE `diagnostico`
  MODIFY `id_diagnostico` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `disponibilidad_consultorio`
--
ALTER TABLE `disponibilidad_consultorio`
  MODIFY `id_disponibilidad` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `especialidad`
--
ALTER TABLE `especialidad`
  MODIFY `id_especialidad` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `factura_saas`
--
ALTER TABLE `factura_saas`
  MODIFY `id_factura` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `historial_reprogramacion`
--
ALTER TABLE `historial_reprogramacion`
  MODIFY `id_historial` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `historia_clinica`
--
ALTER TABLE `historia_clinica`
  MODIFY `id_historia` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `institucion`
--
ALTER TABLE `institucion`
  MODIFY `id_institucion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `medicamento_formulado`
--
ALTER TABLE `medicamento_formulado`
  MODIFY `id_item_formula` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `meta_clinica`
--
ALTER TABLE `meta_clinica`
  MODIFY `id_meta` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `nota_evolucion`
--
ALTER TABLE `nota_evolucion`
  MODIFY `id_nota` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `notificacion`
--
ALTER TABLE `notificacion`
  MODIFY `id_notificacion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `orden_examen`
--
ALTER TABLE `orden_examen`
  MODIFY `id_orden` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `paciente`
--
ALTER TABLE `paciente`
  MODIFY `id_paciente` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `permiso`
--
ALTER TABLE `permiso`
  MODIFY `id_permiso` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `plan_comercial`
--
ALTER TABLE `plan_comercial`
  MODIFY `id_plan` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `profesional_salud`
--
ALTER TABLE `profesional_salud`
  MODIFY `id_profesional` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `reporte_generado`
--
ALTER TABLE `reporte_generado`
  MODIFY `id_reporte` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `rol`
--
ALTER TABLE `rol`
  MODIFY `id_rol` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `sede`
--
ALTER TABLE `sede`
  MODIFY `id_sede` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `seguimiento_control`
--
ALTER TABLE `seguimiento_control`
  MODIFY `id_seguimiento` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `signos_vitales`
--
ALTER TABLE `signos_vitales`
  MODIFY `id_signos` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `suscripcion`
--
ALTER TABLE `suscripcion`
  MODIFY `id_suscripcion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `tratamiento`
--
ALTER TABLE `tratamiento`
  MODIFY `id_tratamiento` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `agenda_medica`
--
ALTER TABLE `agenda_medica`
  ADD CONSTRAINT `fk_agenda_consultorio` FOREIGN KEY (`id_consultorio`) REFERENCES `consultorio` (`id_consultorio`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_agenda_profesional` FOREIGN KEY (`id_profesional`) REFERENCES `profesional_salud` (`id_profesional`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `anexo_clinico`
--
ALTER TABLE `anexo_clinico`
  ADD CONSTRAINT `fk_anexo_atencion` FOREIGN KEY (`id_atencion`) REFERENCES `atencion_medica` (`id_atencion`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anexo_historia` FOREIGN KEY (`id_historia`) REFERENCES `historia_clinica` (`id_historia`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anexo_usuario` FOREIGN KEY (`id_usuario_sube`) REFERENCES `usuario` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `antecedente_clinico`
--
ALTER TABLE `antecedente_clinico`
  ADD CONSTRAINT `fk_antecedente_atencion` FOREIGN KEY (`id_atencion`) REFERENCES `atencion_medica` (`id_atencion`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_antecedente_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_paciente`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_antecedente_profesional` FOREIGN KEY (`id_profesional`) REFERENCES `profesional_salud` (`id_profesional`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `atencion_medica`
--
ALTER TABLE `atencion_medica`
  ADD CONSTRAINT `fk_atencion_cita` FOREIGN KEY (`id_cita`) REFERENCES `cita_medica` (`id_cita`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_atencion_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_paciente`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_atencion_profesional` FOREIGN KEY (`id_profesional`) REFERENCES `profesional_salud` (`id_profesional`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `auditoria_clinica`
--
ALTER TABLE `auditoria_clinica`
  ADD CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `bloqueo_agenda`
--
ALTER TABLE `bloqueo_agenda`
  ADD CONSTRAINT `fk_bloqueo_profesional` FOREIGN KEY (`id_profesional`) REFERENCES `profesional_salud` (`id_profesional`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `cita_medica`
--
ALTER TABLE `cita_medica`
  ADD CONSTRAINT `fk_cita_consultorio` FOREIGN KEY (`id_consultorio`) REFERENCES `consultorio` (`id_consultorio`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cita_institucion` FOREIGN KEY (`id_institucion`) REFERENCES `institucion` (`id_institucion`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cita_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_paciente`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cita_profesional` FOREIGN KEY (`id_profesional`) REFERENCES `profesional_salud` (`id_profesional`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `configuracion_alerta`
--
ALTER TABLE `configuracion_alerta`
  ADD CONSTRAINT `fk_configalerta_institucion` FOREIGN KEY (`id_institucion`) REFERENCES `institucion` (`id_institucion`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `configuracion_alerta_canal`
--
ALTER TABLE `configuracion_alerta_canal`
  ADD CONSTRAINT `fk_configalertacanal_config` FOREIGN KEY (`id_configuracion`) REFERENCES `configuracion_alerta` (`id_configuracion`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `consultorio`
--
ALTER TABLE `consultorio`
  ADD CONSTRAINT `fk_consultorio_sede` FOREIGN KEY (`id_sede`) REFERENCES `sede` (`id_sede`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `diagnostico`
--
ALTER TABLE `diagnostico`
  ADD CONSTRAINT `fk_diagnostico_atencion` FOREIGN KEY (`id_atencion`) REFERENCES `atencion_medica` (`id_atencion`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_diagnostico_cie10` FOREIGN KEY (`codigo_cie10`) REFERENCES `catalogo_cie10` (`codigo_cie10`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `disponibilidad_consultorio`
--
ALTER TABLE `disponibilidad_consultorio`
  ADD CONSTRAINT `fk_disponibilidad_consultorio` FOREIGN KEY (`id_consultorio`) REFERENCES `consultorio` (`id_consultorio`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `especialidad`
--
ALTER TABLE `especialidad`
  ADD CONSTRAINT `fk_especialidad_institucion` FOREIGN KEY (`id_institucion`) REFERENCES `institucion` (`id_institucion`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `factura_saas`
--
ALTER TABLE `factura_saas`
  ADD CONSTRAINT `fk_factura_suscripcion` FOREIGN KEY (`id_suscripcion`) REFERENCES `suscripcion` (`id_suscripcion`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `historial_reprogramacion`
--
ALTER TABLE `historial_reprogramacion`
  ADD CONSTRAINT `fk_historial_cita` FOREIGN KEY (`id_cita`) REFERENCES `cita_medica` (`id_cita`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_historial_usuario` FOREIGN KEY (`id_usuario_responsable`) REFERENCES `usuario` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `historia_clinica`
--
ALTER TABLE `historia_clinica`
  ADD CONSTRAINT `fk_historia_institucion` FOREIGN KEY (`id_institucion`) REFERENCES `institucion` (`id_institucion`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_historia_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_paciente`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `medicamento_formulado`
--
ALTER TABLE `medicamento_formulado`
  ADD CONSTRAINT `fk_medformulado_tratamiento` FOREIGN KEY (`id_tratamiento`) REFERENCES `tratamiento` (`id_tratamiento`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `meta_clinica`
--
ALTER TABLE `meta_clinica`
  ADD CONSTRAINT `fk_meta_seguimiento` FOREIGN KEY (`id_seguimiento`) REFERENCES `seguimiento_control` (`id_seguimiento`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `nota_evolucion`
--
ALTER TABLE `nota_evolucion`
  ADD CONSTRAINT `fk_nota_atencion` FOREIGN KEY (`id_atencion`) REFERENCES `atencion_medica` (`id_atencion`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nota_historia` FOREIGN KEY (`id_historia`) REFERENCES `historia_clinica` (`id_historia`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nota_profesional` FOREIGN KEY (`id_profesional`) REFERENCES `profesional_salud` (`id_profesional`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `notificacion`
--
ALTER TABLE `notificacion`
  ADD CONSTRAINT `fk_notificacion_institucion` FOREIGN KEY (`id_institucion`) REFERENCES `institucion` (`id_institucion`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notificacion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `orden_examen`
--
ALTER TABLE `orden_examen`
  ADD CONSTRAINT `fk_orden_atencion` FOREIGN KEY (`id_atencion`) REFERENCES `atencion_medica` (`id_atencion`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orden_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_paciente`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orden_profesional` FOREIGN KEY (`id_profesional`) REFERENCES `profesional_salud` (`id_profesional`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `paciente`
--
ALTER TABLE `paciente`
  ADD CONSTRAINT `fk_paciente_institucion` FOREIGN KEY (`id_institucion`) REFERENCES `institucion` (`id_institucion`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `plan_modulo_funcional`
--
ALTER TABLE `plan_modulo_funcional`
  ADD CONSTRAINT `fk_planmod_plan` FOREIGN KEY (`id_plan`) REFERENCES `plan_comercial` (`id_plan`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `profesional_especialidad`
--
ALTER TABLE `profesional_especialidad`
  ADD CONSTRAINT `fk_profesesp_especialidad` FOREIGN KEY (`id_especialidad`) REFERENCES `especialidad` (`id_especialidad`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_profesesp_profesional` FOREIGN KEY (`id_profesional`) REFERENCES `profesional_salud` (`id_profesional`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `profesional_salud`
--
ALTER TABLE `profesional_salud`
  ADD CONSTRAINT `fk_profesional_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `reporte_generado`
--
ALTER TABLE `reporte_generado`
  ADD CONSTRAINT `fk_reporte_institucion` FOREIGN KEY (`id_institucion`) REFERENCES `institucion` (`id_institucion`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reporte_usuario` FOREIGN KEY (`id_usuario_generador`) REFERENCES `usuario` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `rol_permiso`
--
ALTER TABLE `rol_permiso`
  ADD CONSTRAINT `fk_rolpermiso_permiso` FOREIGN KEY (`id_permiso`) REFERENCES `permiso` (`id_permiso`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rolpermiso_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `sede`
--
ALTER TABLE `sede`
  ADD CONSTRAINT `fk_sede_institucion` FOREIGN KEY (`id_institucion`) REFERENCES `institucion` (`id_institucion`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `seguimiento_control`
--
ALTER TABLE `seguimiento_control`
  ADD CONSTRAINT `fk_seguimiento_diagnostico` FOREIGN KEY (`id_diagnostico`) REFERENCES `diagnostico` (`id_diagnostico`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_seguimiento_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_paciente`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_seguimiento_profesional` FOREIGN KEY (`id_profesional`) REFERENCES `profesional_salud` (`id_profesional`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `signos_vitales`
--
ALTER TABLE `signos_vitales`
  ADD CONSTRAINT `fk_signos_atencion` FOREIGN KEY (`id_atencion`) REFERENCES `atencion_medica` (`id_atencion`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `suscripcion`
--
ALTER TABLE `suscripcion`
  ADD CONSTRAINT `fk_suscripcion_institucion` FOREIGN KEY (`id_institucion`) REFERENCES `institucion` (`id_institucion`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_suscripcion_plan` FOREIGN KEY (`id_plan`) REFERENCES `plan_comercial` (`id_plan`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `tratamiento`
--
ALTER TABLE `tratamiento`
  ADD CONSTRAINT `fk_tratamiento_diagnostico` FOREIGN KEY (`id_diagnostico`) REFERENCES `diagnostico` (`id_diagnostico`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tratamiento_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_paciente`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tratamiento_profesional` FOREIGN KEY (`id_profesional`) REFERENCES `profesional_salud` (`id_profesional`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `fk_usuario_institucion` FOREIGN KEY (`id_institucion`) REFERENCES `institucion` (`id_institucion`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
