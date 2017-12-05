{
	'targets': [{
		'target_name': 'touch_code_native',
		'type': 'static_library',
		'sources': [
			'native_fs.cc',
			'native_git.cc',
			'native_svn.cc',
			'native_util.cc',
			'native_util.h',
			'native_zip.cc',
			'version.h',
		],
	}]
}