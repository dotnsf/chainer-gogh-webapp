# chainer-gogh-webapp

## Overview

Web front-end application for [chainer-gogh](https://github.com/mattya/chainer-gogh).


## Caution

This web application(`webapp`) can be run on public server. But that is not our recommended way to execute.

We recommend that you should run this application on **your local machine**. This application need huge processing resource to run, and huge amount of time to complete. Sharing is not appropriate way.


## Setup

We expect you setup `chainer-gogh` and `webapp` in same folder, like this:

```
  :
|- chainer-gogh/
|
|- webapp/
  : 
```

### chainer-gogh-webapp

Web front-end of chainer-gogh.


#### How to install chainer-gogh-web

- Install Node.js and npm.

- Git clone `chainer-gogh-webapp`:

  - https://github.com/dotnsf/chainer-gogh-webapp

- Install dependent libraries:

  - `$ cd chainer-gogh-webapp`

  - `$ npm install`


#### How to run chainer-gogh-web

- Run with node.js(without GPU, nin model, and lam=0.005):

  - `$ node app`

- Run with node.js with GPU, vgg model, and lam=0.01:

  - `$ GPU=1 model=vgg lam=0.01 node app`


#### How to use chainer-gogh-web

- Access to web page:

  - http://localhost:8080/

- Input MyDoodle ID as style image.

  - Transparent background would be regarded as `black`.

- Specify image file as main image.

- Click `RESULT` button.


### chainer-gogh

Backend main module of this application.


#### How to install chainer-gogh

- Install Python 3.x and pip.

- Install Anaconda:

  - https://www.kkaneko.jp/tools/ubuntu/anaconda.html

- Install chainer with pip:

  - `$ pip install chainer`

- Install pillow with conda:

  - `$ conda install -c anaconda pillow`

- Install cupy with conda(if you use GPU):

  - `$ conda install -c anaconda cupy`

- Install and setup CUDA(if you use GPU):

  - https://developer.nvidia.com/cuda-downloads

- Git clone `chainer-gogh`:

  - `$ cd chainer-gogh-webapp`

  - `$ git clone https://github.com/mattya/chainer-gogh`

- Download nin model, and put it to chainer-gogh foler:

  - https://www.dropbox.com/s/cphemjekve3d80n/nin_imagenet.caffemodel?dl=1

- (Optional)Download vgg model, and put it to chainer-gogh foler:

  - http://www.robots.ox.ac.uk/~vgg/software/very_deep/caffe/VGG_ILSVRC_16_layers.caffemodel

- Edit some files for recent environment:

  `chainer-gogh.py`
  ```
   13 : - from chainer.functions import caffe
   13 : + from chainer.links import caffe

  100 : - mid_orig = nn.forward(Variable(img_orig, volatile=True))
  101 : - style_mats = [get_matrix(y) for y in nn.forward(Variable(img_style, volatile=True))]
  100 : + with chainer.using_config("enable_backprop", False):
  101 : +     mid_orig = nn.forward(Variable(img_orig))
  102 : + with chainer.using_config("enable_backprop", False):
  103 : +     style_mats = [get_matrix(y) for y in nn.forward(Variable(img_style))]
  ```

  `models.py`
  ```
    5 : - from chainer.functions import caffe
    5 : + from chainer.links import caffe

   22 : - x3 = F.relu(getattr(self.model,"conv4-1024")(F.dropout(F.average_pooling_2d(F.relu(y3), 3, stride=2), train=False)))
   22 : + x3 = F.relu(getattr(self.model,"conv4-1024")(F.dropout(F.average_pooling_2d(F.relu(y3), 3, stride=2))))

   74 : - y6 = self.model.conv6_4(F.relu(F.dropout(self.model.conv6_3(F.relu(self.model.conv6_2(F.relu(self.model.conv6_1(x5))))), train=False)))
   74 : + y6 = self.model.conv6_4(F.relu(F.dropout(self.model.conv6_3(F.relu(self.model.conv6_2(F.relu(self.model.conv6_1(x5))))))))
  ```


#### How to run chainer-gogh with CPU and NIN model

- Put main image(main.png) into chainer-gogh folder.

- Put sub image(sub.png) into chainer-gogh folder.

- Run following command (to output into output_dir/ folder):

  - `$ python chainer-gogh.py -m nin -i main.png -s sub.png -o output_dir -g -1`


#### How to run chainer-gogh with GPU and VGG model

- Run following command (to output into output_dir/ folder):

  - `$ python chainer-gogh.py -m vgg -i main.png -s sub.png -o output_dir -g 0`


## References

https://chime-note.hatenablog.com/entry/chainer-gogh-cat-sakura

https://chime-note.hatenablog.com/entry/chainer-gogh-using-gpu

https://qiita.com/virtual_techX/items/d234d063cd638f4daa59

https://tech.preferred.jp/ja/blog/chainer-gogh/


## Licensing

This code is licensed under MIT.


## Copyright

2021 K.Kimura @ Juge.Me all rights reserved.

