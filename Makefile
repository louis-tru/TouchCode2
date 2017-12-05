
NODE ?= node

.PHONY: all build_ace build_svn

.SECONDEXPANSION:

all: build_ace build_svn

build_ace:
	cd libs/ace; \
	rm -rf build; \
	make build
	# if [ ! -d ace-min ]; then mkdir ace-min ; fi
	mkdir -p ./js/ace-min
	rm -rf ./js/ace-min/*.js
	rm -rf ./js/ace-min/snippets/*.js
	cp -rf ./libs/ace/build/src-min/* ./js/ace-min/
	$(NODE) ./tools/update_build_touch_code_ace.js

build_svn:
	cd ./depe/subversion-1.8.13/apr; ./build-ios.sh
	cd ./depe/subversion-1.8.13/apr-util; ./build-ios.sh
	cd ./depe/subversion-1.8.13/serf; ./build-ios.sh
	cd ./depe/subversion-1.8.13; ./build-ios.sh
