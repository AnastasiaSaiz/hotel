const express = require("express");
const mongodb = require("mongodb");
const servidor = express();

servidor.use(express.static("public"));
servidor.use(express.urlencoded({ extended: false }));
servidor.use(express.json());

const MongoClient = mongodb.MongoClient;

let db;

MongoClient.connect("mongodb://localhost:27017", function (error, client) {
    if (error !== null) {
        console.log(error);
    } else {
        db = client.db("hotel");
    }
});

//Ruta tipo POST para registrar un cliente//
servidor.post("/registro", function (request, response) {
    const usuario = request.body;

    db.collection("clientes").insertOne(usuario, function (error, datos) {
        if (error !== null) {
            response.send(error);
        } else {
            response.send(datos);
        }
    });
});

//Ruta PUT para editar al cliente//

servidor.put("/editarcliente", function (request, response) {
    const dni = request.body.dni;
    const cliente = {
        nombre: request.body.nombre,
        apellido: request.body.apellido,
    };

    db.collection("clientes").updateOne({ dni: dni }, { $set: cliente }, function (error, datos) {
        if (error !== null) {
            response.send(error);
        } else {
            response.send(datos);
        }
    })
});

//Ruta POST para hacer el checkin// Si el cliente no existe, sale el mensaje de que no está registrado//

servidor.post("/checkin", function (request, response) {
    const checkin = request.body;

    db.collection("clientes").find({ dni: checkin.dni }).toArray(function (error, cliente) {
        if (error !== null) {
            response.send(error);
        } else {
            if (cliente.length === 0) {
                response.send({ mensaje: "Cliente no registrado" })
            } else {
                db.collection("habitaciones").find({ numero: checkin.numero }).toArray(function (error, habitacion) {
                    if (error !== null) {
                        response.send(error);
                    } else {
                        if (habitacion[0].estado === "ocupado") {
                            response.send({ mensaje: "Habitación ocupada" })
                        } else {
                            db.collection("reservas").insertOne({ numero: checkin.numero, dni: checkin.dni, fechaCheckIn: checkin.checkin }, function (error, datos) {
                                if (error !== null) {
                                    response.send(error);
                                } else {
                                    db.collection("habitaciones").updateOne({ numero: checkin.numero }, { $set: { estado: "ocupado" } }, function (error, data) {
                                        if (error !== null) {
                                            response.send(error);
                                        } else {
                                            response.send({ mensaje: "Reserva realizada" });
                                        }
                                    })
                                }
                            })
                        }
                    }
                })
            }
        }
    })
});

//Realizamos el CheckOut por lo que hacemos el PUT para la actualización de la habitación//

servidor.put("/checkout", function (request, response) {
    const dni = request.body.dni;
    const fechafin = request.body.checkout;

    db.collection("reservas").find({ dni: dni }).toArray(function (error, reserva) {
        if (error !== null) {
            response.send(error);
        } else {
            if (reserva.length === 0) {
                response.send({ mensaje: "No existe la reserva" })
            } else {
                db.collection("reservas").updateOne({ dni: dni }, { $set: { fechaCheckOut: fechafin } }, function (error, datos) {
                    if (error !== null) {
                        response.send(error);
                    } else {
                        db.collection("habitaciones").updateOne({ numero: reserva[0].numero }, { $set: { estado: "libre" } }, function (error, data) {
                            if (error !== null) {
                                response.send(error);
                            } else {
                                response.send({ mensaje: "Gracias por su visita" });
                            }
                        })
                    }
                })
            }
        }
    })

})



servidor.listen(3000);