# 学习消息队列-RabbitMQ入门
created by zhangbo on 2022/05/09
## 背景
之前使用过RabbitMQ,  只是在用它推消息，说白了就是调个方法， 所以说对它一些基本概念和这个运行的逻辑不是很清楚， 前天和一位后端同学聊起来就顺便看了看, 学习了一下。
## 什么是消息队列？
对于传统的应用程序，如果需要向另一个应用程序发送信息，只需要向其发出请求即可！
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f38404d647ad46b19d80d8e32baa2dc4~tplv-k3u1fbpfcp-zoom-1.image)
这种方式虽然简单直接，但是如果应用程序2突然挂了，应用程序1可能会因为服务异常，而无法继续提供服务！
设想一下，在应用程序1和应用程序2之间，插入一个消息服务，主要用于接受消息和发送消息，这样应用程序1和应用程序2之间的依赖关系就解耦了，同时也不会因为任何一方当服务不可用时，无法继续提供服务！
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d16d3629700e44c9aa26463af781fd14~tplv-k3u1fbpfcp-zoom-1.image)
**其中插入的消息服务被称为消息队列**！
## 使用场景
### 异步处理
发送者将消息发送给消息队列之后，不需要同步等待消息接收者处理完毕，而是立即返回进行其它操作。消息接收者从消息队列中订阅消息之后异步处理。

例如在注册流程中通常需要发送验证邮件来确保注册用户身份的合法性，可以使用消息队列使发送验证邮件的操作异步处理，用户在填写完注册信息之后就可以完成注册，而将发送验证邮件这一消息发送到消息队列中。

只有在业务流程允许异步处理的情况下才能这么做，例如上面的注册流程中，如果要求用户对验证邮件进行点击之后才能完成注册的话，就不能再使用消息队列。
### 流量削锋
在高并发的场景下，如果短时间有大量的请求到达会压垮服务器。
可以将请求发送到消息队列中，服务器按照其处理能力从消息队列中订阅消息进行处理。
### 应用解耦
如果模块之间不直接进行调用，模块之间耦合度就会很低，那么修改一个模块或者新增一个模块对其它模块的影响会很小，从而实现可扩展性。

通过使用消息队列，一个模块只需要向消息队列中发送消息，其它模块可以选择性地从消息队列中订阅消息从而完成调用。

**比方鑫资产来了订单给崔岩推数据， 如果崔岩那边同同时在发布， 就导致发送失败，如果有消息列表，只需要将消息推到消息队列中，崔岩需要的时候自己订阅去拿， 松散耦合。**
## RabbitMQ 中的概念
### 消息模型
所有 MQ 产品从模型抽象上来说都是一样的过程： 消费者（consumer）订阅某个队列。生产者（producer）创建消息，然后发布到队列（queue）中，最后将消息发送到监听的消费者。
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/76b308ad4d394a2da65ad3f20eaf8c74~tplv-k3u1fbpfcp-zoom-1.image)
### RabbitMQ 基本概念
上面只是最简单抽象的描述，具体到 RabbitMQ 则有更详细的概念需要解释。上面介绍过 RabbitMQ 是 AMQP 协议([https://zhuanlan.zhihu.com/p/147675691](https://zhuanlan.zhihu.com/p/147675691))的一个开源实现，所以其内部实际上也是 AMQP 中的基本概念：
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/80a377d445774908908cfdaff54ae347~tplv-k3u1fbpfcp-zoom-1.image)
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d2b6e8eb0da741be93ff7a1aebe9d4bc~tplv-k3u1fbpfcp-zoom-1.image)

1. Message 消息，消息是不具名的，它由消息头和消息体组成。消息体是不透明的，而消息头则由一系列的可选属性组成，这些属性包括routing-key（路由键）、priority（相对于其他消息的优先权）、delivery-mode（指出该消息可能需要持久性存储）等。
1. Publisher 消息的生产者，也是一个向交换器发布消息的客户端应用程序。
1. Exchange 交换器，用来接收生产者发送的消息并将这些消息路由给服务器中的队列。
1. Binding 绑定，用于消息队列和交换器之间的关联。一个绑定就是基于路由键将交换器和消息队列连接起来的路由规则，所以可以将交换器理解成一个由绑定构成的路由表。
1. Queue 消息队列，用来保存消息直到发送给消费者。它是消息的容器，也是消息的终点。一个消息可投入一个或多个队列。消息一直在队列里面，等待消费者连接到这个队列将其取走。
1. Connection 网络连接，比如一个TCP连接。
1. Channel 信道，多路复用连接中的一条独立的双向数据流通道。信道是建立在真实的TCP连接内地虚拟连接，AMQP 命令都是通过信道发出去的，不管是发布消息、订阅队列还是接收消息，这些动作都是通过信道完成。因为对于操作系统来说建立和销毁 TCP 都是非常昂贵的开销，所以引入了信道的概念，以复用一条 TCP 连接。
1. Consumer 消息的消费者，表示一个从消息队列中取得消息的客户端应用程序。
1. Broker 表示消息队列服务器实体。
#### AMQP 中的消息路由过程
AMQP 中有 Exchange 和 Binding 的角色。生产者把消息发布到 Exchange 上，消息最终到达队列并被消费者接收，而 Binding 决定交换器的消息应该发送到那个队列。

**生产者**: 连接服务->发送消息(带着消息、指定交换机、指定Key)-> Binding通过交换机+key吧消息发到指定队列

由Exchange、Queue、RoutingKey三个才能决定一个从Exchange到Queue的唯一的线路。
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a997d87686c74aec88664a5652a8cf7d~tplv-k3u1fbpfcp-zoom-1.image)


#### Exchange 交换机的类型
Exchange分发消息时根据类型的不同分发策略有区别，目前共四种类型：direct、fanout、topic、headers 。headers 匹配 AMQP 消息的 header 而不是路由键，此外 headers 交换器和 direct 交换器完全一致，但性能差很多，目前几乎用不到了，所以直接看另外三种类型：

1. direct 
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6ef524baa13548649a54d45d73f3fb8e~tplv-k3u1fbpfcp-zoom-1.image)

消息中的路由键（routing key）如果和 Binding 中的 binding key 一致， 交换器就将消息发到对应的队列中。路由键与队列名完全匹配，如果一个队列绑定到交换机要求路由键为“dog”，则只转发 routing key 标记为“dog”的消息，不会转发“dog.puppy”，也不会转发“dog.guard”等等。它是完全匹配、单播的模式。

2. fanout 
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7ed698c6c8a8409fae6bb0a27de8f614~tplv-k3u1fbpfcp-zoom-1.image)

每个发到 fanout 类型交换器的消息都会分到所有绑定的队列上去。fanout 交换器不处理路由键，只是简单的将队列绑定到交换器上，每个发送到交换器的消息都会被转发到与该交换器绑定的所有队列上。很像子网广播，每台子网内的主机都获得了一份复制的消息。fanout 类型转发消息是最快的。

3. topic 
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/00fe3070361644e8869cbb0c7e2d6dd4~tplv-k3u1fbpfcp-zoom-1.image) 


topic 交换器通过模式匹配分配消息的路由键属性，将路由键和某个模式进行匹配，此时队列需要绑定到一个模式上。它将路由键和绑定键的字符串切分成单词，这些单词之间用点隔开。它同样也会识别两个通配符：符号“#”和符号“*”。#匹配0个或多个单词，*匹配不多不少一个单词。
## Docker安装rabbitmq 

- 拉RabbitMQ 3.7.15的Docker镜像
```javascript
docker pull rabbitmq:3.7.15
```

- 使用Docker命令启动服务
```javascript
docker run -p 5672:5672 -p 15672:15672 --name rabbitmq \
-d rabbitmq:3.7.15
```

- 进入容器并开启管理功能；
```javascript
docker exec -it rabbitmq /bin/bash
rabbitmq-plugins enable rabbitmq_management
```

它的管理页面地址 [http://localhost:15672/](http://localhost:15672/)  默认账号密码 是 guest/guest， 可进去自行添加用户

## 使用Node.js发送/消费消息
安装AMQP客户端的包 [https://www.npmjs.com/package/amqplib](https://www.npmjs.com/package/amqplib)
```javascript
npm install amqplib
```
代码参考 amqplib仓库代码示例 [https://github.com/amqp-node/amqplib/tree/main/examples/tutorials](https://github.com/amqp-node/amqplib/tree/main/examples/tutorials)
```javascript
const amqplib = require('amqplib');
const dayjs = require('dayjs');
const log = require('../../core/log');

// RabbitMQ的配置
const rabbitmqConfig = {
  options: {
    protocol: 'amqp',
    hostname: '127.0.0.1',
    port: '5672',
    username: 'guest',
    password: 'guest',
  },
  key: {
    exchange: 'test_exchange01',
    router: 'testQ01',
    EXCHANGE_TYPE: {
      direct: 'direct',
    },
  },
};
let conn;

class RabbitMQ {
  abbitmqConfig;

  constructor(config) {
    this.abbitmqConfig = config;
  }

  getConnect() {}

  /**
   * 发消息
   * @param {string} key 路由
   * @param {string} msg 消息
   */
  async send(key, msg) {
    try {
      const {
        options,
        key: { EXCHANGE_TYPE, exchange },
      } = this.abbitmqConfig;
      if (!conn) {
        conn = await amqplib.connect(options);
        conn.on('close', async () => {
          conn = await amqplib.connect(options);
        });
      }

      // 创建信道
      const ch = await conn.createChannel();
      // 声明队列
      const queueResult = await ch.assertQueue(key);
      // 声明交换机
      const ok = await ch.assertExchange(exchange, EXCHANGE_TYPE.direct, {
        durable: true,
      });
      // 绑定交换机和路由
      await ch.bindQueue(key, exchange, key);

      process.once('exit', () => {
        log.info('Key RabbitMQ意外退出');
        ch.close();
        conn.close();
      });

      // eslint-disable-next-line consistent-return
      // return ok.then(() => {
      // 向交换机指定路由发送信息
      ch.publish(exchange, key, Buffer.from(msg));
      //   await ch.sendToQueue(queueResult.queue, new Buffer(msg), {
      //     expiration: '10000'
      // });
      // log.info(" [x] Sent %s:'%s'", msg);
      ch.close();
      // });
    } catch (err) {
      log.error('send msg error:', err);
      // throw err;
    }
  }

  /**
   * 订阅消息
   * @param {string} key 路由
   */
  async consume(key) {
    try {
      const {
        options,
      } = rabbitmqConfig;
      if (!conn) {
        conn = await amqplib.connect(options);
        conn.on('close', async () => {
          conn = await amqplib.connect(options);
        });
      }

      // 创建信道
      const ch = await conn.createChannel();
      await ch.prefetch(1);
      ch.consume(key, (msg) => {
        setTimeout(() => {
          ch.ack(msg);
          log.info(" [x] Consume %s:'%s'", msg.content.toString());
        }, 1000);
      });
      // }, { noAck: true });
    } catch (error) {
      log.error('Consume msg error:', error);
    }
  }
}

// 实例一个RabbitMQ
const rabbitMQ = new RabbitMQ(rabbitmqConfig);

// 订阅指定队列
rabbitMQ.consume(rabbitmqConfig.key.router);

// 我这里模拟， 定时器每隔一秒给RabbitMQ推一条消息
setInterval(() => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  rabbitMQ.send(rabbitmqConfig.key.router, JSON.stringify({
    orderNo: new Date().getTime(),
    createdAt: now,
    name: 'zhangbo',
  }));
}, 1000);


```
## 可靠性
### 发送端的可靠性
发送端完成操作后一定能将消息成功发送到消息队列中。
实现方法：在本地数据库建一张消息表，将消息数据与业务数据保存在同一数据库实例里，这样就可以利用本地数据库的事务机制。事务提交成功后，将消息表中的消息转移到消息队列中，若转移消息成功则删除消息表中的数据，否则继续重传。
### 接收端的可靠性
接收端能够从消息队列成功消费一次消息。
两种实现方法：

- 保证接收端处理消息的业务逻辑具有幂等性：只要具有幂等性，那么消费多少次消息，最后处理的结果都是一样的。
- 保证消息具有唯一编号，并使用一张日志表来记录已经消费的消息编号。
## 总结
消息队列有很多优点，但是，引入消息队列也会带来很明显的弊端：

**系统可用性降低**：在引入消息队列之前，你不用考虑消息丢失或者消息队列服务挂掉等等的情况，但是引入消息队列之后你就需要去考虑这些问题！

**系统复杂性提高**：加入消息队列之后，你需要保证消息没有被重复消费、处理消息没有被正确处理的情况等等问题！