import 'dotenv/config';
import mongoose from 'mongoose';
import { Clase } from '../models/Clase.js';
import { Grupo } from '../models/Grupo.js';
import { Materia } from '../models/Materia.js';
import { DiaSemana } from '../models/DiaSemana.js';
import { ETS } from '../models/ETS.js';
import { Usuario } from '../models/Usuario.js';
import { Carrera } from '../models/Carrera.js';

const MONGODB_URI = process.env.MONGO_URI;

async function revisarBaseDatos() {
  try {
    if (!MONGODB_URI) {
      throw new Error('Falta MONGO_URI en variables de entorno.');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // === 1. REVISAR GRUPOS ===
    console.log('═══════════════════════════════════════════');
    console.log('📦 GRUPOS');
    console.log('═══════════════════════════════════════════');
    const grupos = await Grupo.find().limit(5);
    console.log(`Total grupos en DB: ${await Grupo.countDocuments()}`);
    grupos.forEach(g => {
      console.log(`\n  ID: ${g._id}`);
      console.log(`  Nombre: ${g.nombre || 'N/A'}`);
      console.log(`  Semestre: ${g.semestre || 'N/A'}`);
      console.log(`  Turno: ${g.turno || 'N/A'}`);
      console.log(`  Salón: ${g.salon || 'N/A'}`);
    });

    // === 2. REVISAR CLASES ===
    console.log('\n\n═══════════════════════════════════════════');
    console.log('📚 CLASES (con horarios y profesores)');
    console.log('═══════════════════════════════════════════');
    const clases = await Clase.find()
      .populate('idGrupo', 'nombre semestre turno')
      .populate('idMateria', 'nombre clave')
      .populate('idProfesor', 'nombre')
      .populate('horario.lunes.idDia')
      .populate('horario.martes.idDia')
      .populate('horario.miercoles.idDia')
      .populate('horario.jueves.idDia')
      .populate('horario.viernes.idDia')
      .limit(3);

    console.log(`Total clases en DB: ${await Clase.countDocuments()}`);
    clases.forEach(c => {
      console.log(`\n  ID Clase: ${c._id}`);
      console.log(`  Grupo: ${c.idGrupo?.nombre || 'N/A'}`);
      console.log(`  Materia: ${c.idMateria?.nombre || 'N/A'}`);
      console.log(`  Salón: ${c.salon || 'N/A'}`);
      console.log(`  Profesor: ${c.idProfesor?.nombre || 'N/A'}`);
      console.log(`  Horarios:`);
      if (c.horario?.lunes?.idDia) {
        console.log(`    Lunes: ${c.horario.lunes.idDia.horarioInicio}-${c.horario.lunes.idDia.horarioFinal}`);
      }
      if (c.horario?.martes?.idDia) {
        console.log(`    Martes: ${c.horario.martes.idDia.horarioInicio}-${c.horario.martes.idDia.horarioFinal}`);
      }
      if (c.horario?.miercoles?.idDia) {
        console.log(`    Miércoles: ${c.horario.miercoles.idDia.horarioInicio}-${c.horario.miercoles.idDia.horarioFinal}`);
      }
      if (c.horario?.jueves?.idDia) {
        console.log(`    Jueves: ${c.horario.jueves.idDia.horarioInicio}-${c.horario.jueves.idDia.horarioFinal}`);
      }
      if (c.horario?.viernes?.idDia) {
        console.log(`    Viernes: ${c.horario.viernes.idDia.horarioInicio}-${c.horario.viernes.idDia.horarioFinal}`);
      }
    });

    // === 3. REVISAR ETS ===
    console.log('\n\n═══════════════════════════════════════════');
    console.log('📝 ETS (Exámenes a Título de Suficiencia)');
    console.log('═══════════════════════════════════════════');
    const ets = await ETS.find()
      .populate('idProfesor', 'nombre')
      .populate('idMateria', 'nombre')
      .populate('idCarrera', 'nombre')
      .populate('idDiaSemana')
      .limit(5);

    console.log(`Total ETS en DB: ${await ETS.countDocuments()}`);
    ets.forEach(e => {
      console.log(`\n  ID ETS: ${e._id}`);
      console.log(`  Profesor: ${e.idProfesor?.nombre || 'N/A'}`);
      console.log(`  Materia: ${e.idMateria?.nombre || 'N/A'}`);
      console.log(`  Carrera: ${e.idCarrera?.nombre || 'N/A'}`);
      console.log(`  Salón: ${e.salon || 'N/A'}`);
      console.log(`  Horario: ${e.idDiaSemana?.horarioInicio || 'N/A'} - ${e.idDiaSemana?.horarioFinal || 'N/A'}`);
      console.log(`  Día de semana en ETS: ${e.dia || '❌ NO TIENE CAMPO DIA'}`);
    });

    // === 4. REVISAR DIASEMANA ===
    console.log('\n\n═══════════════════════════════════════════');
    console.log('🕐 DIA SEMANA');
    console.log('═══════════════════════════════════════════');
    const diasSemana = await DiaSemana.find().limit(10);
    console.log(`Total DiaSemana en DB: ${await DiaSemana.countDocuments()}`);
    diasSemana.forEach(d => {
      console.log(`\n  ID: ${d._id}`);
      console.log(`  Día: ${d.dia || '❌ NO TIENE CAMPO DIA'}`);
      console.log(`  Horario: ${d.horarioInicio} - ${d.horarioFinal}`);
    });

    // === 5. REVISAR PROFESORES ===
    console.log('\n\n═══════════════════════════════════════════');
    console.log('👨‍🏫 PROFESORES');
    console.log('═══════════════════════════════════════════');
    const profesores = await Usuario.find({ rol: 'Profesor' }).limit(3);
    console.log(`Total profesores en DB: ${await Usuario.countDocuments({ rol: 'Profesor' })}`);
    profesores.forEach(p => {
      console.log(`\n  ID: ${p._id}`);
      console.log(`  Nombre: ${p.nombre || 'N/A'}`);
      console.log(`  RFC: ${p.datosPersonales?.rfc || 'N/A'}`);
    });

    // === 6. CONTAR CLASES POR PROFESOR ===
    console.log('\n\n═══════════════════════════════════════════');
    console.log('📊 ESTADÍSTICAS');
    console.log('═══════════════════════════════════════════');
    const profesorConClases = await Usuario.findOne({ rol: 'Profesor' });
    if (profesorConClases) {
      const clasesProfesor = await Clase.countDocuments({ idProfesor: profesorConClases._id });
      const etsProfesor = await ETS.countDocuments({ idProfesor: profesorConClases._id });
      console.log(`\nProfesor: ${profesorConClases.nombre}`);
      console.log(`  Clases asignadas: ${clasesProfesor}`);
      console.log(`  ETS asignados: ${etsProfesor}`);
    }

    await mongoose.disconnect();
    console.log('\n\n✅ Revisión completada - Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

revisarBaseDatos();
