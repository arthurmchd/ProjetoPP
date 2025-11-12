CREATE DATABASE cadastro_usuarios;
USE cadastro_usuarios;

CREATE TABLE usuarios (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(100),
);

CREATE TABLE favoritos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome_produto VARCHAR(50) NOT NULL,
    potencia INT NOT NULL,
    horas FLOAT NOT NULL,
    data_favoritado DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
