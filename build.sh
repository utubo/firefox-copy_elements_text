#!/usr/bin/sh

SCRIPT_DIR=$(cd $(dirname $0); pwd)
cd $SCRIPT_DIR/src
zip -r ../copy_elements_text.zip *
cd ..
mv -f copy_elements_text.zip copy_elements_text.xpi

