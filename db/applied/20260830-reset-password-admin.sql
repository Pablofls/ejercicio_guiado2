-- Cambia la contraseña del usuario admin@libreria.com a "admin".
-- El hash fue generado con bcrypt (cost 10), el mismo algoritmo y factor que usa
-- src/modules/auth/auth.model.js (bcrypt.hash(password, 10)), por lo que el login
-- de la aplicación lo valida sin cambios.
--
-- Nota: el comentario de demo.sql dice que la contraseña sembrada era "admin123",
-- pero el hash que hay ahí corresponde en realidad a "password".

UPDATE usuarios
SET password_hash = '$2b$10$UE.lBOsdhut7k8y2vTA74.X/qtKdnYmXpfmd0hzZ7dw/i2YS6UEyq'
WHERE email = 'admin@libreria.com';
