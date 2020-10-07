exports.up = function (knex) {
  return knex.schema

    .createTable('users', (table) => {
      table.uuid('id').primary().notNullable();
      table.string('email').notNullable();
      table.string('password').notNullable();
      table.boolean('isDelete').defaultTo(false);
      table.string('type');
      table.string('restoreToken');
      table.timestamp('expires');
      table.timestamps(true, true);
    })

    .createTable('review', (table) => {
      table.uuid('id').primary().notNullable();
      table.string('message');
      table.integer('rating');
      table.boolean('isDelete').defaultTo(false);
      table.timestamps(true, true);
    })

    .createTable('restaurant', (table) => {
      table.uuid('id').primary().notNullable();
      table.string('name').notNullable();
      table.string('address').notNullable();
      table.uuid('userId').notNullable().references('users.id')
        .onDelete('CASCADE');
      table.boolean('isDelete').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['userId', 'isDelete']);
    })

    .createTable('waiter', (table) => {
      table.uuid('id').primary().notNullable();
      table.string('firstName').notNullable();
      table.string('lastName').notNullable();
      table.uuid('userId').notNullable().references('users.id')
        .onDelete('CASCADE');
      table.uuid('cardInfo');
      table.uuid('restaurantId').notNullable().references('restaurant.id')
        .onDelete('CASCADE');
      table.boolean('isDelete').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['userId', 'restaurantId', 'isDelete']);
    })

    .createTable('visitor', (table) => {
      table.uuid('id').primary().notNullable();
      table.string('firstName').notNullable();
      table.string('lastName').notNullable();
      table.uuid('cardInfo');
      table.uuid('userId').notNullable().references('users.id')
        .onDelete('CASCADE');
      table.boolean('isDelete').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['userId', 'isDelete']);
    })

    .createTable('restaurantTicket', (table) => {
      table.uuid('id').primary().notNullable();
      table.string('name').notNullable();
      table.string('phone').notNullable();
      table.string('comment');
      table.boolean('isDelete').defaultTo(false);
      table.timestamps(true, true);
    })

    .createTable('guest', (table) => {
      table.uuid('id').primary().notNullable();
      table.string('firstName').notNullable();
      table.string('lastName').notNullable();
      table.boolean('isDelete').defaultTo(false);
      table.timestamps(true, true);
    })

    .createTable('card', (table) => {
      table.uuid('id').primary().notNullable();
      table.string('cardFirstSix').notNullable();
      table.string('cardLastFour').notNullable();
      table.string('cardExpDate').notNullable();
      table.string('cardType').notNullable();
      table.string('accountId').notNullable();
      table.string('recurringToken');
      table.boolean('isDelete').defaultTo(false);
      table.uuid('userId');
      table.uuid('guestId');
      table.timestamps(true, true);
    })

    .createTable('tipInfo', (table) => {
      table.uuid('id').primary().notNullable();
      table.uuid('waiterId').references('users.id');
      table.uuid('visitorId').references('users.id');
      table.uuid('guestId').references('guest.id');
      table.string('transactionStatus').notNullable();
      table.string('transactionInfo');
      table.uuid('paymentCard');
      table.integer('price');
      table.string('idTransaction');
      table.uuid('reviewId').references('review.id')
        .onDelete('CASCADE');
      table.boolean('isDelete').defaultTo(false);
      table.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('users')
    .dropTableIfExists('review')
    .dropTableIfExists('restaurant')
    .dropTableIfExists('waiter')
    .dropTableIfExists('visitor')
    .dropTableIfExists('restaurantTicket')
    .dropTableIfExists('guest')
    .dropTableIfExists('card')
    .dropTableIfExists('tipInfo');
};
