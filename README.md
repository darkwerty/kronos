# Kronos

Un registro de hábitos con mecánica de RPG: cada hábito sube de nivel con la experiencia (XP) que ganas al
cumplirlo. API REST en FastAPI con SQLite y migraciones de Alembic, y una interfaz en React con Vite, todo en Docker.

La especificación de partida está en
[`Especificación de Requisitos de Software_ Proyecto Kronos.pdf`](Especificación%20de%20Requisitos%20de%20Software_%20Proyecto%20Kronos.pdf).

## Qué hace

- **Hábitos con meta diaria**: binarios («check») o con cantidad y unidad (por ejemplo, 30 flexiones), con los días
  de la semana en que tocan y una categoría.
- **Checklist del día**: cada hábito activo con su progreso (sin registro, en progreso o completado), sacado con un
  `LEFT JOIN` que filtra la fecha en la condición de unión.
- **Registro idempotente**: `POST /habits/{id}/logs` crea o actualiza el registro de un día (si no se manda cantidad,
  se toma la meta) y `DELETE /habits/{id}/logs/{fecha}` lo quita. Un solo registro por hábito y día
  (`UNIQUE(habit_id, logged_date)`).
- **Metas congeladas**: cada registro guarda la meta y la unidad de ese día, así que cambiar la meta después no altera
  los porcentajes del pasado.
- **Sin borrado físico**: los hábitos pasan por los estados activo, en pausa (no aparece ni admite registros, pero
  conserva la XP) y archivado.
- **XP y niveles**: 10 XP por día cumplido y la parte proporcional si te quedas a medias. Pasar del nivel N al N+1
  cuesta N × 100 XP. El nivel se calcula siempre a partir de la XP total, así que al borrar un registro también baja.
  Además hay rachas de días seguidos y rangos (de Novato a Titán).
- **Cuentas**: se puede usar sin cuenta (modo invitado) o entrar con Google o GitHub; al entrar, los hábitos creados
  como invitado pasan a la cuenta. La sesión es un JWT.
- **Historial y estadísticas** por categoría, y una versión para móvil con controles táctiles grandes.

## Ejecutarlo

Con Docker:

```bash
docker compose up --build   # API en http://localhost:8000 (documentación en /docs), web en http://localhost:3000
```

La API aplica las migraciones al arrancar y guarda la base de datos SQLite en el volumen `db_data`. Las variables van
en un `.env` en la raíz (todas opcionales en local):

```bash
JWT_SECRET_KEY=          # cámbiala fuera de local
ALLOWED_ORIGINS=         # orígenes CORS separados por comas (por defecto, todos)
GOOGLE_CLIENT_ID=        # login con Google
GITHUB_CLIENT_ID=        # login con GitHub
GITHUB_CLIENT_SECRET=
VITE_GOOGLE_CLIENT_ID=
VITE_GITHUB_CLIENT_ID=
```

Tests (46, con pytest):

```bash
pip install -r requirements.txt
pytest
```

## Estructura

```
app/
  models.py        tablas: usuarios, categorías, hábitos y registros
  crud.py          consultas, upsert de registros y estados
  gamification.py  XP, niveles, rachas y rangos
  auth.py          JWT y verificación de Google y GitHub
  routers/         hábitos, registros, categorías y login
alembic/           migraciones
frontend/          React + Vite
tests/             pytest
```
